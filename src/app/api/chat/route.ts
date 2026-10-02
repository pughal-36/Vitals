import { streamText, convertToModelMessages, type UIMessage, tool } from "ai";
import { z } from "zod";
import * as cheerio from "cheerio";
import { geminiFlash } from "@/lib/gemini/model";
import { AUDIT_SUMMARY_PROMPT } from "@/lib/gemini/prompts";

// ─── POST /api/chat ───
// Receives the conversation history from useChat on the client,
// streams Gemini's response back token-by-token.
//
// How this works:
//   1. useChat sends the full messages array as { messages: UIMessage[] }
//   2. convertToModelMessages translates the UI format (which can include
//      tool calls, images, etc.) into the format the language model expects
//   3. streamText returns a StreamTextResult synchronously — no await needed.
//      The actual generation starts lazily when the response body is consumed.
//   4. toUIMessageStreamResponse() converts the stream into the "UI Message
//      Stream Protocol" — a format that useChat on the client parses
//      automatically. This replaced toDataStreamResponse() in AI SDK v7.

export async function POST(req: Request) {
  try {
    const sabotageHeader = req.headers.get("x-sabotage");
    const isSabotageEnabled = process.env.ENABLE_SABOTAGE === "true";

    if (isSabotageEnabled && sabotageHeader) {
      if (sabotageHeader === "429") {
        return Response.json({ error: "Sabotage Rate Limit", code: "rate_limit" }, { status: 429 });
      }
      if (sabotageHeader === "500") {
        return Response.json({ error: "Sabotage Server Error", code: "upstream_model_error" }, { status: 500 });
      }
      if (sabotageHeader === "slow") {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const body = await req.json();
    const messages: UIMessage[] = body.messages;

    // Validate input server-side: reject empty or missing messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Messages are required", code: "invalid_input" },
        { status: 400 }
      );
    }

    // Validate input server-side: reject empty or whitespace-only user messages
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      const hasContent = lastMessage.parts?.some(part => {
        if (part.type === "text") return part.text.trim().length > 0;
        return true; // Any non-text part (like files) is considered content
      });

      if (!hasContent) {
        return Response.json(
          { error: "Message cannot be empty", code: "invalid_input" },
          { status: 400 }
        );
      }
    }

    const abortController = new AbortController();
    if (isSabotageEnabled && sabotageHeader === "midstream") {
      setTimeout(() => abortController.abort(), 1500); // Abort mid-stream
    }

    // streamText returns synchronously — the streaming is lazy.
    const result = streamText({
      model: geminiFlash,
      system: AUDIT_SUMMARY_PROMPT,
      abortSignal: abortController.signal,
      // convertToModelMessages translates UIMessage[] (client format with parts,
      // tool invocations, etc.) into the ModelMessage[] format the LLM expects.
      messages: await convertToModelMessages(messages),
      tools: {
        fetchMetaTags: tool({
          description: "Fetch and parse meta tags (title, description, OpenGraph) from a given URL.",
          inputSchema: z.object({
            url: z.string().url("Must be a valid URL"),
          }),
          execute: async ({ url }) => {
            if (isSabotageEnabled && sabotageHeader === "malformed") {
              const obj: any = {};
              obj.self = obj; // Circular reference to break JSON serialization
              return obj;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            return {
              title: $("title").text() || null,
              description: $("meta[name='description']").attr("content") || null,
              ogTitle: $("meta[property='og:title']").attr("content") || null,
              ogDescription: $("meta[property='og:description']").attr("content") || null,
              ogImage: $("meta[property='og:image']").attr("content") || null,
              canonicalUrl: $("link[rel='canonical']").attr("href") || null,
            };
          },
        }),
      },
    });

    // Return the stream as an HTTP response.
    // toUIMessageStreamResponse() sets the correct headers and encodes the
    // stream in the protocol that useChat understands.
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        // Mask the raw error and avoid leaking stack traces mid-stream
        console.error("Mid-stream error:", error);
        return "An error occurred while generating the response. Please try again.";
      },
    });
  } catch (error: any) {
    console.error("Chat route handler error:", error);

    // Determine the status code based on the error
    const statusCode = typeof error?.statusCode === "number" ? error.statusCode : undefined;

    if (statusCode === 429 || error?.name === "RateLimitError") {
      return Response.json(
        { error: "Rate limit exceeded. Please try again later.", code: "rate_limit" },
        { status: 429 }
      );
    }

    if (statusCode === 500 || statusCode === 502 || error?.name === "APICallError") {
      return Response.json(
        { error: "The AI provider encountered an error. Please try again.", code: "upstream_model_error" },
        { status: statusCode >= 500 ? statusCode : 502 }
      );
    }

    // Generic fallback for any other setup errors
    return Response.json(
      { error: "An unexpected internal error occurred.", code: "internal_server_error" },
      { status: 500 }
    );
  }
}

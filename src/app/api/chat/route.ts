import { streamText, convertToModelMessages, type UIMessage, tool } from "ai";
import { z } from "zod";
import * as cheerio from "cheerio";
import { geminiFlash } from "@/lib/gemini/model";
import { AUDIT_SUMMARY_PROMPT } from "@/lib/gemini/prompts";
import { cookies } from "next/headers";

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

    // ─── Supabase scan context (from main) ───
    const cookieStore = await cookies();
    const scanId = cookieStore.get("scanId")?.value;

    const getMessageText = (message: UIMessage): string => {
      return message.parts
        ? message.parts.filter((part: any) => part.type === "text").map((part: any) => part.text).join("")
        : (message as any).text || (message as any).content || "";
    };

    let systemPrompt = AUDIT_SUMMARY_PROMPT;

    if (scanId) {
      try {
        // Save user message to Supabase
        if (lastMessage && lastMessage.role === "user") {
          const { getSupabaseClient } = await import("@/lib/supabase/client");
          await (getSupabaseClient() as any).from("chat_messages").insert({
            scan_id: scanId,
            role: "user",
            content: getMessageText(lastMessage)
          });
        }

        // Load scan and build dynamic system prompt
        const { getScanById } = await import("@/lib/supabase/scans");
        const scan = await getScanById(scanId);
        if (scan) {
          const failingAudits = (scan.raw_categories as any)?.failingAudits || [];
          const top5 = failingAudits.slice(0, 5).map((a: any) => `- ${a.title}: ${a.description} (Score: ${a.score})`).join("\n");
          systemPrompt = `
You are an expert SEO and Web Performance assistant.
The user is asking about their website: ${scan.url}
Scores:
Performance: ${scan.score_performance}
SEO: ${scan.score_seo}
Accessibility: ${scan.score_accessibility}
Best Practices: ${scan.score_best_practices}

Top Failing Audits:
${top5 || "None"}

Please provide helpful advice based on this context. Keep your answers brief and formatting clean.
${AUDIT_SUMMARY_PROMPT}
`;
        }
      } catch (err) {
        console.error("Error setting up chat context/saving:", err);
      }
    }

    const abortController = new AbortController();
    if (isSabotageEnabled && sabotageHeader === "midstream") {
      setTimeout(() => abortController.abort(), 1500);
    }

    // streamText returns synchronously — the streaming is lazy.
    const result = streamText({
      model: geminiFlash,
      system: systemPrompt,
      abortSignal: abortController.signal,
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
              obj.self = obj;
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
      onFinish: async ({ text }) => {
        if (scanId && text) {
          try {
            const { getSupabaseClient } = await import("@/lib/supabase/client");
            await (getSupabaseClient() as any).from("chat_messages").insert({
              scan_id: scanId,
              role: "assistant",
              content: text
            });
          } catch (err) {
            console.error("Failed to save assistant message", err);
          }
        }
      }
    });

    // Return the stream as an HTTP response.
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        // Mask the raw error and avoid leaking stack traces mid-stream
        console.error("Mid-stream error:", error);
        return "An error occurred while generating the response. Please try again.";
      },
    });
  } catch (error: any) {
    console.error("Chat route handler error:", error);

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

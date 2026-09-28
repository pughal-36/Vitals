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

import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const cookieStore = await cookies();
  const scanId = cookieStore.get("scanId")?.value;

  const getMessageText = (message: UIMessage): string => {
    return message.parts
      ? message.parts.filter((part: any) => part.type === "text").map((part: any) => part.text).join("")
      : (message as any).text || (message as any).content || "";
  };

  let systemPrompt = AUDIT_SUMMARY_PROMPT;
  
  // Extract the latest user message to save it
  const latestUserMessage = messages[messages.length - 1];

  if (scanId) {
    try {
      // 1. Save user message to Supabase
      if (latestUserMessage && latestUserMessage.role === "user") {
        const { getSupabaseClient } = await import("@/lib/supabase/client");
        await (getSupabaseClient() as any).from("chat_messages").insert({
          scan_id: scanId,
          role: "user",
          content: getMessageText(latestUserMessage)
        });
      }

      // 2. Load scan and build dynamic system prompt
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

  const result = streamText({
    model: geminiFlash,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      fetchMetaTags: tool({
        description: "Fetch and parse meta tags (title, description, OpenGraph) from a given URL.",
        inputSchema: z.object({
          url: z.string().url("Must be a valid URL"),
        }),
        execute: async ({ url }) => {
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
    onError: ({ error }) => {
      console.error("streamText error:", error);
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

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `An error occurred: ${errorMessage}`;
    },
  });
}

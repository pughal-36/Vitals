import { streamText, convertToModelMessages, type UIMessage } from "ai";
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
  // useChat sends { messages: UIMessage[] } automatically on each submit.
  const { messages }: { messages: UIMessage[] } = await req.json();

  // streamText returns synchronously — the streaming is lazy.
  const result = streamText({
    model: geminiFlash,
    system: AUDIT_SUMMARY_PROMPT,
    // convertToModelMessages translates UIMessage[] (client format with parts,
    // tool invocations, etc.) into the ModelMessage[] format the LLM expects.
    messages: await convertToModelMessages(messages),
  });

  // Return the stream as an HTTP response.
  // toUIMessageStreamResponse() sets the correct headers and encodes the
  // stream in the protocol that useChat understands (text parts, tool calls,
  // step boundaries, etc.). This is NOT the same as NextResponse.json() —
  // JSON requires the full response to be buffered before sending.
  return result.toUIMessageStreamResponse();
}

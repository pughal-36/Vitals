"use client";

// ─── AuditChat ───
// Client component that uses the AI SDK's useChat hook to stream
// messages from Gemini Flash via /api/chat. This is a "use client"
// component because useChat relies on React state and effects.
//
// What useChat gives us for free:
//   - messages[]       : the full conversation (user + assistant), auto-updated
//   - sendMessage()    : appends a user message and triggers the API call
//   - stop()           : aborts the stream; partial text stays in messages
//   - status           : "ready" | "submitted" | "streaming" | "error"
//   - setMessages()    : manual override (useful for clearing)
//
// We DON'T need to:
//   - manage an AbortController
//   - parse the stream protocol
//   - manually append assistant responses
//   - re-send conversation history (useChat does it automatically)

import { useChat } from "@ai-sdk/react";
import { type UIMessage } from "ai";
import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Tool Invocation UI Component ───
function ToolInvocationUI({ toolInvocation }: { toolInvocation: any }) {
  if (toolInvocation.toolName !== 'fetchMetaTags') {
    return null;
  }

  const { state, args, result } = toolInvocation;
  const url = args?.url || "url";

  // input-streaming
  if (state === 'partial-call') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted animate-pulse py-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>preparing to check {url}...</span>
      </div>
    );
  }

  // input-available
  if (state === 'call') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface my-2 shadow-sm transition-opacity duration-200">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm font-medium">Fetching meta tags for <span className="text-primary">{url}</span>...</span>
      </div>
    );
  }

  // output-available or output-error
  if (state === 'result') {
    if (result && result.error) {
      return (
        <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger my-2 shadow-sm transition-opacity duration-200">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Error fetching meta tags
          </div>
          <div className="text-sm opacity-90">{result.error}</div>
        </div>
      );
    }
    
    if (typeof result === 'string') {
       return (
        <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger my-2 shadow-sm transition-opacity duration-200">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Error fetching meta tags
          </div>
          <div className="text-sm opacity-90">{result}</div>
        </div>
      );
    }

    const { title, description, ogTitle, ogDescription, ogImage, canonicalUrl } = result || {};

    const renderField = (label: string, value: string | null | undefined, isImage: boolean = false) => {
      if (!value) {
        return (
          <td className="px-4 py-3 text-sm text-muted italic">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-muted/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Not found
            </span>
          </td>
        );
      }
      return (
        <td className="px-4 py-3 text-sm font-medium text-foreground">
          {isImage ? (
            <img src={value} alt="OG Image Thumbnail" className="h-12 w-auto max-w-[120px] rounded border border-border" />
          ) : (
             <span className="break-all">{value}</span>
          )}
        </td>
      );
    };

    return (
      <div className="my-3 rounded-xl border border-border overflow-hidden shadow-sm bg-surface transition-opacity duration-200 animate-in fade-in">
        <div className="bg-primary/5 px-4 py-2 border-b border-border flex items-center gap-2 text-sm font-semibold text-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Meta Tags Found
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-border">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-muted w-1/3 bg-surface-hover/50">Title</th>
                {renderField('Title', title)}
              </tr>
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-muted bg-surface-hover/50">Description</th>
                {renderField('Description', description)}
              </tr>
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-muted bg-surface-hover/50">OG Title</th>
                {renderField('OG Title', ogTitle)}
              </tr>
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-muted bg-surface-hover/50">OG Description</th>
                {renderField('OG Description', ogDescription)}
              </tr>
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-muted bg-surface-hover/50">OG Image</th>
                {renderField('OG Image', ogImage, true)}
              </tr>
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-muted bg-surface-hover/50">Canonical URL</th>
                {renderField('Canonical URL', canonicalUrl)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuditChat() {
  // ─── useChat hook ───
  // By default it POSTs to /api/chat, which is exactly where our route handler lives.
  const { messages, sendMessage, stop, status, setMessages } = useChat();

  // ─── Local state for the text input ───
  // In AI SDK v7 useChat doesn't manage input state for us like v3 did,
  // so we manage it ourselves.
  const [input, setInput] = useState("");

  // ─── Refs ───
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track whether the user is pinned to the bottom of the scroll area.
  // If they scroll up manually, we stop auto-scrolling.
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Derived state: is the AI currently working?
  const isGenerating = status === "submitted" || status === "streaming";

  // ─── Auto-scroll logic ───
  // Only scroll to bottom if the user hasn't scrolled up manually.
  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Detect whether the user is at the bottom of the scroll container.
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    // "At bottom" = within 80px of the actual bottom (generous threshold
    // to account for elastic scrolling on mobile and minor rounding).
    const threshold = 80;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
  }, []);

  // Scroll to bottom when the user clicks "Jump to latest"
  const jumpToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  }, []);

  // ─── Form submission ───
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;

    // sendMessage appends the user message and triggers the API call.
    // useChat auto-sends the full messages array to /api/chat.
    sendMessage({ text: trimmed });
    setInput("");

    // Refocus the input after sending.
    inputRef.current?.focus();
  };

  // ─── Extract text from message parts ───
  const getMessageText = (message: UIMessage): string => {
    return message.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-theme(spacing.20))] max-w-3xl mx-auto w-full px-4">
      {/* ─── Messages area ─── */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-6 space-y-4 scroll-smooth"
      >
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Audit Assistant</h2>
            <p className="text-muted text-sm max-w-sm">
              Ask about web performance, Core Web Vitals, or paste your PageSpeed audit data for an AI-powered summary.
            </p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((message, idx) => {
          const isLastAssistant =
            message.role === "assistant" && idx === messages.length - 1;
          const isStreaming = status === "streaming" && isLastAssistant;
          return (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-surface border border-border text-foreground rounded-bl-md"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="flex flex-col gap-2 w-full">
                    {message.parts.map((part, partIdx) => {
                      if (part.type === "text" && part.text) {
                        return (
                          <div key={partIdx} className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {part.text}
                            </ReactMarkdown>
                            {/* Streaming/typing indicator — blinking cursor while tokens arrive */}
                            {isStreaming && partIdx === message.parts.length - 1 && (
                              <span
                                aria-label="Generating…"
                                className="inline-block w-2 h-4 ml-0.5 align-middle bg-primary/70 rounded-sm animate-pulse"
                              />
                            )}
                          </div>
                        );
                      } else if (part.type === "tool-invocation") {
                        return <ToolInvocationUI key={part.toolCallId} toolInvocation={part} />;
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{getMessageText(message)}</p>
                )}
              </div>
            </div>
          );
        })}

        {/* ─── Thinking indicator ───
            Shows when status is "submitted" (request sent, waiting for first token).
            When status moves to "streaming", the assistant message appears in messages[]
            automatically, so this indicator disappears naturally — no flicker because
            the indicator and the first token are never both visible at the same time. */}
        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-xs text-muted">Thinking…</span>
            </div>
          </div>
        )}

        {/* 5. Error state — shown when the stream drops mid-response */}
        {status === "error" && (
          <div
            role="alert"
            className="flex justify-start"
          >
            <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 bg-danger/10 border border-danger/30 text-sm">
              <p className="text-danger font-semibold mb-1">Connection dropped</p>
              <p className="text-muted text-xs">
                The response stream was interrupted. Your previous messages are still here — try sending your question again.
              </p>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ─── Jump to latest button ───
          Only visible when the user has scrolled up and there are messages. */}
      {!isAtBottom && messages.length > 0 && (
        <div className="flex justify-center -mt-12 mb-2 relative z-10">
          <button
            onClick={jumpToBottom}
            className="px-3 py-1.5 rounded-full bg-surface border border-border text-xs text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-200 shadow-lg flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Jump to latest
          </button>
        </div>
      )}

      {/* ─── Input area ─── */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex items-end gap-2 py-4 border-t border-border/40"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Submit on Enter (without Shift for newline)
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Ask about web performance…"
          rows={1}
          disabled={isGenerating}
          className="flex-1 resize-none rounded-xl bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] max-h-32"
          style={{
            // Auto-grow textarea up to max-h
            height: "auto",
            overflow: input.split("\n").length > 4 ? "auto" : "hidden",
          }}
        />

        {/* Send or Stop button — swaps based on whether the AI is generating */}
        {isGenerating ? (
          <button
            type="button"
            onClick={() => stop()}
            className="shrink-0 h-[44px] px-4 rounded-xl bg-danger/90 hover:bg-danger text-white text-sm font-semibold transition-all duration-200 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 h-[44px] px-5 rounded-xl bg-primary hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Send
          </button>
        )}
      </form>
    </div>
  );
}

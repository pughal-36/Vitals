import AuditChat from "@/app/chat/AuditChat";
import { getScanById } from "@/lib/supabase/scans";
import { getChatHistory } from "@/lib/supabase/chat";
import Link from "next/link";
import RememberScan from "@/components/RememberScan";
import type { UIMessage } from "ai";

export default async function AssistantPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const [scan, history] = await Promise.all([
    getScanById(scanId),
    getChatHistory(scanId),
  ]);
  if (!scan) {
    return (
      <main id="main-content" tabIndex={-1} className="scan-empty flex-1 px-4 py-20 sm:py-28 outline-none">
        <div className="mx-auto max-w-xl border border-border bg-surface p-7 sm:p-10">
          <h1 className="text-3xl font-semibold tracking-[-.04em] text-foreground">Scan not found</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            The requested audit scan could not be found or has expired. Please run a new scan from the Audit page.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex min-h-11 items-center border border-foreground bg-foreground px-5 text-sm font-medium text-background"
          >
            Back to Audit
          </Link>
        </div>
      </main>
    );
  }
  
  // Map Supabase rows to AI SDK UIMessage format
  const initialMessages: UIMessage[] = history.map((msg) => ({
    id: msg.id,
    role: msg.role as UIMessage["role"],
    parts: [{ type: 'text', text: msg.content }],
  }));
  if (initialMessages.length === 0) {
    initialMessages.push({
      id: `audit-intro-${scanId}`,
      role: "assistant",
      parts: [{ type: "text", text: `Here's what I found in your audit of ${scan.url}: Performance ${scan.score_performance ?? 0}, SEO ${scan.score_seo ?? 0}, Accessibility ${scan.score_accessibility ?? 0}, and Best Practices ${scan.score_best_practices ?? 0}. Ask me about any finding or choose a suggested question below. You can return to your Readout for the full findings, or back to Audit to run another scan.` }],
    });
  }

  const failingAudits = (scan.raw_categories as { failingAudits?: Array<{ title: string }> } | null)?.failingAudits || [];
  const initialChips = failingAudits.slice(0, 4).map((audit) => `How do I fix "${audit.title}"?`);
  if (initialChips.length === 0) {
    initialChips.push("How can I improve performance?", "What is Core Web Vitals?", "How do I fix SEO issues?");
  }
  
  return (
    <main id="main-content" tabIndex={-1} className="vitals-chat-page flex-1 flex flex-col outline-none">
      <h1 className="sr-only">Audit Assistant</h1>
      <RememberScan scanId={scanId} />
      <div className="scan-route-links mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 pt-5">
        <span className="font-mono text-[10px] tracking-[.1em] text-muted">ASSISTANT / {scan.url.replace(/^https?:\/\//, "")}</span>
        <div className="flex gap-2 text-xs">
          <Link href={`/?scan=${scanId}`} className="scan-route-link">Audit</Link>
          <Link href={`/readout/${scanId}?scan=${scanId}`} className="scan-route-link">Readout</Link>
        </div>
      </div>
      <AuditChat scanId={scanId} initialMessages={initialMessages} initialChips={initialChips} />
    </main>
  );
}

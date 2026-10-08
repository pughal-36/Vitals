import AuditChat from "@/app/chat/AuditChat";
import { getScanById } from "@/lib/supabase/scans";
import { getChatHistory } from "@/lib/supabase/chat";
import { redirect } from "next/navigation";
import Link from "next/link";
import RememberScan from "@/components/RememberScan";
import type { UIMessage } from "ai";

export default async function AssistantPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const scan = await getScanById(scanId);
  if (!scan) {
    redirect("/assistant");
  }

  const history = await getChatHistory(scanId);
  
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
    <main className="vitals-chat-page flex-1 flex flex-col">
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

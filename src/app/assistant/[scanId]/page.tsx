import AuditChat from "@/app/chat/AuditChat";
import { getScanById } from "@/lib/supabase/scans";
import { getChatHistory } from "@/lib/supabase/chat";
import { notFound } from "next/navigation";

export default async function AssistantPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const scan = await getScanById(scanId);

  if (!scan) {
    notFound();
  }

  const history = await getChatHistory(scanId);
  
  // Map Supabase rows to AI SDK UIMessage format
  const initialMessages: any[] = history.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    parts: [{ type: 'text', text: msg.content }],
  }));

  const failingAudits = (scan.raw_categories as any)?.failingAudits || [];
  const initialChips = failingAudits.slice(0, 4).map((a: any) => `How do I fix "${a.title}"?`);
  if (initialChips.length === 0) {
    initialChips.push("How can I improve performance?", "What is Core Web Vitals?", "How do I fix SEO issues?");
  }
  
  return (
    <main className="vitals-chat-page flex-1 flex flex-col">
      <AuditChat scanId={scanId} initialMessages={initialMessages} initialChips={initialChips} />
    </main>
  );
}

import { listScans } from "@/lib/supabase/scans";
import Link from "next/link";

function scoreColor(score: number | null): string {
  if (!score) return "text-muted";
  if (score >= 90) return "text-accent";
  if (score >= 50) return "text-warning";
  return "text-danger";
}

export default async function HistoryPage() {
  const scans = await listScans(50);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 gap-8">
      <section className="max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Scan History</h1>
            <p className="text-sm text-muted">All past PageSpeed audits, newest first.</p>
          </div>
        </div>

        {/* Empty state */}
        {scans.length === 0 && (
          <div className="text-center py-24 text-muted">
            <p className="text-lg font-medium mb-2">No scans yet</p>
            <p className="text-sm">Run your first audit from the <Link href="/" className="text-primary underline underline-offset-2">home page</Link>.</p>
          </div>
        )}

        {/* Scan list */}
        {scans.length > 0 && (
          <div className="flex flex-col gap-3">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="rounded-2xl border border-border bg-surface px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* URL + timestamp */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{scan.url}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(scan.created_at).toLocaleString()} · {scan.strategy}
                  </p>
                </div>

                {/* Score pills */}
                <div className="flex gap-3 shrink-0 text-xs font-semibold tabular-nums">
                  {([
                    ["Perf", scan.score_performance],
                    ["A11y", scan.score_accessibility],
                    ["BP",   scan.score_best_practices],
                    ["SEO",  scan.score_seo],
                  ] as const).map(([label, score]) => (
                    <span key={label} className={`flex flex-col items-center ${scoreColor(score)}`}>
                      <span className="text-base leading-none">{score ?? "—"}</span>
                      <span className="text-[10px] text-muted font-normal mt-0.5">{label}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

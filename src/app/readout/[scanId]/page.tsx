import { getScanById } from "@/lib/supabase/scans";
import { redirect } from "next/navigation";
import Link from "next/link";
import RememberScan from "@/components/RememberScan";

type FailingAudit = { id: string; title: string; description?: string; score?: number | null; displayValue?: string | null };

export default async function ReadoutPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const scan = await getScanById(scanId);
  if (!scan) redirect("/readout");

  const scores = [
    { label: "Performance", key: "performance", score: scan.score_performance ?? 0 },
    { label: "Accessibility", key: "accessibility", score: scan.score_accessibility ?? 0 },
    { label: "Best Practices", key: "best-practices", score: scan.score_best_practices ?? 0 },
    { label: "SEO", key: "seo", score: scan.score_seo ?? 0 },
  ];
  const raw = scan.raw_categories as { failingAudits?: FailingAudit[] } | null;
  const failingAudits = raw?.failingAudits || [];
  const composite = Math.round(scores.reduce((total, item) => total + item.score, 0) / scores.length);

  return (
    <main className="results-page flex-1">
      <RememberScan scanId={scanId} />
      <nav className="scan-route-links mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-5" aria-label="Audit navigation">
        <span className="text-sm text-muted">Saved audit / {scan.id}</span>
        <div className="flex gap-2 text-sm">
          <Link href={`/?scan=${scanId}`} className="scan-route-link">Audit</Link>
          <Link href={`/assistant/${scanId}?scan=${scanId}`} className="scan-route-link">Assistant</Link>
        </div>
      </nav>
      <section className="results-hero px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-5 text-sm text-white/80">Saved audit</p>
            <h1 className="break-all text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{scan.url.replace(/^https?:\/\//, "")}</h1>
            <p className="mt-4 break-all text-sm text-white/80">{scan.url}</p>
          </div>
          <div className="shrink-0">
            <p className="text-sm text-white/80">Overall score</p>
            <p className="mt-2 text-6xl font-bold tabular-nums text-[#E8D86A]">{composite}<span className="ml-2 text-base font-normal text-white/80">/100</span></p>
            <p className="mt-3 text-sm text-white/80">{scan.strategy} strategy</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-accent">Score summary</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Four checks.<br />One clear direction.</h2>
          </div>
          <div className="results-panel p-5 sm:p-8">
            <div className="score-list" aria-label="Lighthouse category scores">
              {scores.map(({ label, key, score }) => {
                const value = Math.max(0, Math.min(100, score));
                return <div key={key} className="score-row">
                  <div className="score-row-head"><span>{label}</span><span className="score-value">{score}/100</span></div>
                  <div className="score-track" role="progressbar" aria-label={`${label} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
                    <div className="score-fill" data-category={key} style={{ width: `${value}%` }} />
                  </div>
                </div>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-[#ECEAE2] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-accent">Audit details</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">What needs attention?</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {failingAudits.length > 0 ? failingAudits.map((audit) => (
              <article key={audit.id} className="results-panel min-w-0 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 font-semibold">{audit.title}</h3>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{audit.score != null ? audit.score.toFixed(2) : "—"}</span>
                </div>
                {audit.description && <p className="mt-2 text-sm leading-6 text-muted">{audit.description.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")}</p>}
                {audit.displayValue && <p className="mt-3 text-sm font-medium">{audit.displayValue}</p>}
              </article>
            )) : <p className="results-panel p-6 text-muted">No failing audits detected.</p>}
          </div>
          <p className="mt-5 text-sm text-muted">{failingAudits.length} failing {failingAudits.length === 1 ? "audit" : "audits"} · Live data from Supabase</p>
        </div>
      </section>
    </main>
  );
}

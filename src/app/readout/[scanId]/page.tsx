import { getScanById } from "@/lib/supabase/scans";
import { notFound } from "next/navigation";

function Dial({ score }: { score: number }) {
  const angle = -135 + score * 2.7;
  return (
    <div className="results-dial" aria-label={`${score} out of 100`}>
      <div className="results-dial-face">
        <div className="results-dial-arc" />
        <div className="results-dial-needle" style={{ transform: `rotate(${angle}deg)` }} />
        <div className="results-dial-hub" />
        <div className="absolute inset-0 flex items-center justify-center pt-10 text-[#E8A33D] font-mono text-3xl">{score}</div>
        <div className="absolute inset-x-0 top-[62%] text-center text-[8px] tracking-[.12em] text-[#9EA4AA] font-mono">/ 100</div>
      </div>
    </div>
  );
}

function getState(score: number) {
  if (score >= 90) return "GOOD";
  if (score >= 50) return "REVIEW";
  return "POOR";
}

export default async function ReadoutPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const scan = await getScanById(scanId);

  if (!scan) {
    notFound();
  }

  const scoreCards = [
    ["PERFORMANCE", scan.score_performance || 0, getState(scan.score_performance || 0)],
    ["SEO", scan.score_seo || 0, getState(scan.score_seo || 0)],
    ["ACCESSIBILITY", scan.score_accessibility || 0, getState(scan.score_accessibility || 0)],
    ["BEST PRACTICES", scan.score_best_practices || 0, getState(scan.score_best_practices || 0)],
  ] as const;

  const raw = scan.raw_categories as any;
  const failingAudits = raw?.failingAudits || [];
  
  const composite = Math.round(
    ((scan.score_performance || 0) + (scan.score_seo || 0) + (scan.score_accessibility || 0) + (scan.score_best_practices || 0)) / 4
  );

  return (
    <main className="results-page flex-1">
      <section className="results-hero px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-12">
          <div>
            <div className="font-mono text-[9px] tracking-[.1em] text-[#E8A33D] mb-5">RESULTS / CALIBRATED READOUT</div>
            <h1 className="text-5xl sm:text-7xl font-semibold leading-[.92] tracking-[-.07em] break-all">{scan.url.replace(/^https?:\/\//, '')}</h1>
            <p className="mt-5 font-mono text-xs text-[#AEB4BA]">{scan.url}</p>
          </div>
          <div className="max-w-xs">
            <div className="font-mono text-[9px] tracking-[.1em] text-[#858C92]">COMPOSITE SCORE</div>
            <div className="mt-2 text-[#E8A33D] font-mono text-6xl leading-none tracking-[-.1em]">{composite}<span className="ml-2 text-base tracking-normal text-[#9EA4AA]">/100</span></div>
            <div className="mt-4 flex items-center gap-2 font-mono text-[9px] text-[#AEB4BA]"><span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D]" /> {scan.strategy.toUpperCase()} STRATEGY</div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10"><div className="font-mono text-[9px] tracking-[.1em] text-[#B87E2F] mb-4">01 / SIGNALS</div><h2 className="text-4xl sm:text-5xl font-semibold leading-none tracking-[-.06em]">Four readings.<br /><span className="text-[#B87E2F]">One clear direction.</span></h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {scoreCards.map(([label, score, state], i) => (
              <article key={label} className="results-panel p-5">
                <div className="flex justify-between items-center font-mono text-[9px] tracking-[.06em]"><span>{label}</span><span className="text-[#B87E2F]">● {state}</span></div>
                <div className="mt-4"><Dial score={score as number} /></div>
                <div className="mt-3 flex justify-between font-mono text-[8px] text-[#6E757B]"><span>ANALOG SIGNAL</span><span>VTL / 0{i + 1}</span></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#DADDDF] border-y border-[#AEB4BA] px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-9">
            <div>
              <div className="font-mono text-[9px] tracking-[.1em] text-[#B87E2F] mb-4">02 / FAILING AUDITS</div>
              <h2 className="text-4xl sm:text-5xl font-semibold leading-none tracking-[-.06em]">Read the detail<br /><span className="text-[#B87E2F]">behind the dial.</span></h2>
            </div>
            <span className="font-mono text-[9px] text-[#6E757B]">{scan.url.toUpperCase()} / 001</span>
          </div>
          <div className="overflow-x-auto results-panel bg-[#2B2E33] text-[#E8E9EB]">
            <table className="w-full min-w-[760px] border-collapse font-mono text-[10px]">
              <thead>
                <tr className="border-b border-[#50565C] text-left text-[8px] tracking-[.1em] text-[#858C92]">
                  <th className="px-5 py-4 font-normal">AUDIT</th>
                  <th className="px-5 py-4 font-normal">DESCRIPTION</th>
                  <th className="px-5 py-4 font-normal">SCORE</th>
                  <th className="px-5 py-4 font-normal">VALUE</th>
                </tr>
              </thead>
              <tbody>
                {failingAudits.length > 0 ? failingAudits.map((audit: any) => (
                  <tr key={audit.id} className="border-b border-[#464C52] hover:bg-[#33373D] transition-colors">
                    <td className="px-5 py-4 text-[#D6DADD] w-1/4">{audit.title}</td>
                    <td className="px-5 py-4 text-[#979EA4] w-2/4">{audit.description?.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')}</td>
                    <td className="px-5 py-4 text-[#E8A33D]">{audit.score !== null ? audit.score.toFixed(2) : '-'}</td>
                    <td className="px-5 py-4 text-[#858C92]">{audit.displayValue || '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[#979EA4]">No failing audits detected!</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex justify-between gap-4 px-5 py-4 font-mono text-[8px] tracking-[.05em] text-[#858C92]">
              <span>● LIVE DATA FROM SUPABASE</span>
              <span>{failingAudits.length < 10 ? `0${failingAudits.length}` : failingAudits.length} FAILING AUDITS</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

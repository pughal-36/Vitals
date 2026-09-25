const scoreCards = [
  ["PERFORMANCE", 86, "GOOD"],
  ["SEO", 78, "GOOD"],
  ["ACCESSIBILITY", 92, "STRONG"],
  ["BEST PRACTICES", 74, "REVIEW"],
] as const;

const metrics = [
  ["PERFORMANCE", "Largest Contentful Paint", "1.8 s", "< 2.5 s", "PASS"],
  ["PERFORMANCE", "Cumulative Layout Shift", "0.04", "< 0.10", "PASS"],
  ["SEO", "Meta description", "PRESENT", "REQUIRED", "PASS"],
  ["SEO", "Internal links discovered", "42", "12 pages", "PASS"],
  ["ACCESSIBILITY", "Color contrast checks", "18 / 19", "ALL PASS", "REVIEW"],
  ["BEST PRACTICES", "Deprecated APIs", "0", "NONE", "PASS"],
] as const;

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

export default function ResultsPage() {
  return (
    <main className="results-page flex-1">
      <section className="results-hero px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-12">
          <div>
            <div className="font-mono text-[9px] tracking-[.1em] text-[#E8A33D] mb-5">RESULTS / CALIBRATED READOUT</div>
            <h1 className="text-5xl sm:text-7xl font-semibold leading-[.92] tracking-[-.07em]">Northstar<br /><em className="not-italic text-[#E8A33D]">studio</em></h1>
            <p className="mt-5 font-mono text-xs text-[#AEB4BA]">https://northstar.studio</p>
          </div>
          <div className="max-w-xs">
            <div className="font-mono text-[9px] tracking-[.1em] text-[#858C92]">COMPOSITE SCORE</div>
            <div className="mt-2 text-[#E8A33D] font-mono text-6xl leading-none tracking-[-.1em]">78<span className="ml-2 text-base tracking-normal text-[#9EA4AA]">/100</span></div>
            <div className="mt-4 flex items-center gap-2 font-mono text-[9px] text-[#AEB4BA]"><span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D]" /> GOOD FOUNDATION</div>
            <p className="mt-4 text-sm leading-relaxed text-[#9EA4AA]">Strong signals across the page. Focus next on the small structural gaps to make the readout even clearer.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10"><div className="font-mono text-[9px] tracking-[.1em] text-[#B87E2F] mb-4">01 / SIGNALS</div><h2 className="text-4xl sm:text-5xl font-semibold leading-none tracking-[-.06em]">Four readings.<br /><span className="text-[#B87E2F]">One clear direction.</span></h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {scoreCards.map(([label, score, state]) => (
              <article key={label} className="results-panel p-5">
                <div className="flex justify-between items-center font-mono text-[9px] tracking-[.06em]"><span>{label}</span><span className="text-[#B87E2F]">● {state}</span></div>
                <div className="mt-4"><Dial score={score} /></div>
                <div className="mt-3 flex justify-between font-mono text-[8px] text-[#6E757B]"><span>ANALOG SIGNAL</span><span>VTL / 0{scoreCards.findIndex((card) => card[0] === label) + 1}</span></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#DADDDF] border-y border-[#AEB4BA] px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-9"><div><div className="font-mono text-[9px] tracking-[.1em] text-[#B87E2F] mb-4">02 / METRICS TABLE</div><h2 className="text-4xl sm:text-5xl font-semibold leading-none tracking-[-.06em]">Read the detail<br /><span className="text-[#B87E2F]">behind the dial.</span></h2></div><span className="font-mono text-[9px] text-[#6E757B]">NORTHSTAR.STUDIO / 001</span></div>
          <div className="overflow-x-auto results-panel bg-[#2B2E33] text-[#E8E9EB]"><table className="w-full min-w-[760px] border-collapse font-mono text-[10px]"><thead><tr className="border-b border-[#50565C] text-left text-[8px] tracking-[.1em] text-[#858C92]"><th className="px-5 py-4 font-normal">SIGNAL</th><th className="px-5 py-4 font-normal">METRIC</th><th className="px-5 py-4 font-normal">READING</th><th className="px-5 py-4 font-normal">REFERENCE</th><th className="px-5 py-4 font-normal">STATE</th></tr></thead><tbody>{metrics.map(([category, metric, value, reference, state]) => <tr key={metric} className="border-b border-[#464C52] hover:bg-[#33373D] transition-colors"><td className="px-5 py-4 text-[#979EA4]">● {category}</td><td className="px-5 py-4 text-[#D6DADD]">{metric}</td><td className="px-5 py-4 text-[#E8A33D]">{value}</td><td className="px-5 py-4 text-[#858C92]">{reference}</td><td className={`px-5 py-4 ${state === "REVIEW" ? "text-[#AAB1B7]" : "text-[#E8A33D]"}`}>{state}</td></tr>)}</tbody></table><div className="flex justify-between gap-4 px-5 py-4 font-mono text-[8px] tracking-[.05em] text-[#858C92]"><span>● STATIC DEMO DATA / FRONTEND ONLY</span><span>06 SIGNALS LOGGED</span></div></div>
        </div>
      </section>
    </main>
  );
}

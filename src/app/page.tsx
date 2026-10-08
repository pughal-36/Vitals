import Link from "next/link";
import GlobeExperience from "@/components/GlobeExperience";
import RecentScans from "@/components/RecentScans";
import RememberScan from "@/components/RememberScan";
import UrlAuditForm from "@/components/UrlAuditForm";
import { getScanById } from "@/lib/supabase/scans";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan: scanId } = await searchParams;
  const scan = scanId ? await getScanById(scanId) : null;
  const composite = scan ? Math.round(((scan.score_performance || 0) + (scan.score_seo || 0) + (scan.score_accessibility || 0) + (scan.score_best_practices || 0)) / 4) : undefined;

  return (
    <main className="vitals-home flex-1">
      {scan && <RememberScan scanId={scan.id} />}
      <section className="vitals-hero mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-12" id="hero">
        <div className="hero-copy">
          <div className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 text-[10px] font-mono tracking-[.12em] text-muted mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            GOOGLE PAGESPEED + GEMINI FLASH
          </div>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-.06em] text-foreground sm:text-5xl lg:text-[3.5rem]">
            Audit your site with Vitals. See where you stand out.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted sm:text-lg">A measured first look at your speed, search signals, accessibility, and the next improvements worth making.</p>
          <div className="mt-7"><UrlAuditForm initialScan={scan ?? undefined} /></div>
          {scan && composite !== undefined && <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-mono text-muted">
            <span className="text-[#B87E2F]">LAST AUDIT / {scan.url.replace(/^https?:\/\//, "")}</span>
            <span className="tabular-nums">COMPOSITE {composite}/100</span>
            <Link href={`/readout/${scan.id}?scan=${scan.id}`} className="text-foreground underline underline-offset-4">Open readout</Link>
          </div>}
          <div className="mt-6"><RecentScans /></div>
        </div>
        <div className="min-w-0"><GlobeExperience scanId={scan?.id} score={composite} /></div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-5 border-t border-border px-4 py-9 sm:px-6 md:grid-cols-3" aria-label="Vitals audit workflow">
        <article className="workflow-step"><span>01 / AUDIT</span><h2>Measure the live page.</h2><p>Run a Lighthouse-backed scan with Google PageSpeed Insights.</p></article>
        <article className="workflow-step"><span>02 / READOUT</span><h2>Find the useful signals.</h2><p>See the scores and key findings stored with your scan.</p></article>
        <article className="workflow-step"><span>03 / ASSISTANT</span><h2>Turn findings into next steps.</h2><p>Ask Gemini Flash about this audit, with the saved scan as context.</p></article>
      </section>
      <section className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6" aria-label="How Vitals works">
        <p className="text-xs leading-6 text-muted">Vitals sends your URL to Google PageSpeed Insights for a real Lighthouse audit, saves the scan in Supabase, and uses Gemini Flash to help explain the results. AI-generated advice can be inaccurate; verify recommendations before applying them in production.</p>
      </section>
    </main>
  );
}

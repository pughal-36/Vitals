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
      <section className="vitals-hero" id="hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <h1 id="home-title">Audit your site&apos;s<br />Web Vitals</h1>
        </div>
        <div className="hero-globe" aria-hidden="false">
          <GlobeExperience scanId={scan?.id} score={composite} />
        </div>
        <Link className="hero-cta" href="#audit">Run a scan</Link>
      </section>

      <section id="audit" className="hero-audit" aria-labelledby="audit-title">
        <h2 id="audit-title">Start with a URL</h2>
        <p className="hero-audit-intro">Checks speed, accessibility, best practices and SEO for a page.</p>
        <UrlAuditForm initialScan={scan ?? undefined} />
        <div className="mt-6"><RecentScans /></div>
        {scan && composite !== undefined && <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>Last audit: {scan.url.replace(/^https?:\/\//, "")}</span>
          <span className="tabular-nums">Overall score: {composite}/100</span>
          <Link href={`/readout/${scan.id}?scan=${scan.id}`} className="text-primary underline underline-offset-4">Open readout</Link>
        </div>}
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 border-t border-border px-5 py-9 sm:px-6 md:grid-cols-3" aria-label="Vitals audit workflow">
        <article className="workflow-step"><h2>Audit</h2><p>Runs a Lighthouse scan of the URL using Google PageSpeed Insights.</p></article>
        <article className="workflow-step"><h2>Readout</h2><p>Shows the saved scores for a scan.</p></article>
        <article className="workflow-step"><h2>Assistant</h2><p>Answers questions about a saved scan using Gemini.</p></article>
      </section>
      <section className="mx-auto w-full max-w-6xl px-5 pb-12 sm:px-6" aria-label="How Vitals works">
        <p className="max-w-4xl text-sm leading-6 text-muted">Scans are run by Google PageSpeed Insights and saved in Supabase. Assistant answers come from Gemini and can be wrong; check them before changing production.</p>
      </section>
    </main>
  );
}

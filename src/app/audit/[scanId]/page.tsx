import UrlAuditForm from "@/components/UrlAuditForm";
import RecentScans from "@/components/RecentScans";
import { getScanById } from "@/lib/supabase/scans";
import { notFound } from "next/navigation";

export default async function AuditPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const scan = await getScanById(scanId);

  if (!scan) {
    notFound();
  }

  return (
    <main className="vitals-home flex-1 flex flex-col items-center px-4 py-12 sm:py-20 gap-16">
      <section className="max-w-3xl w-full text-center" id="hero">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-muted mb-6">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Powered by Google PageSpeed Insights &amp; Gemini
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 leading-[1.1]">
          Audit your site&rsquo;s{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Web Vitals
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-muted max-w-xl mx-auto mb-8">
          Enter any URL to get a real-time PageSpeed score, SEO audit, and
          AI‑powered optimisation summary — all in one place.
        </p>

        <UrlAuditForm initialScan={scan} />
        <RecentScans />
      </section>

      <section className="max-w-2xl w-full text-center border-t border-border/40 pt-10">
        <h2 className="text-base font-semibold text-foreground mb-2">How Vitals works</h2>
        <p className="text-sm text-muted mb-3">
          Vitals sends your URL to the <span className="text-foreground font-medium">Google PageSpeed Insights API</span> to run a real Lighthouse audit, then surfaces the scores here. Head to the <a href={`/assistant/${scanId}`} className="text-primary underline-offset-4 hover:underline">Chat tab</a> to ask Gemini Flash for tailored optimisation advice.
        </p>
      </section>
    </main>
  );
}

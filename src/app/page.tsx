import psi from "psi";
import { saveScan } from "@/lib/supabase/scans";
import { Suspense } from "react";

/* ─── Types ─── */
type HealthSuccess = {
  ok: true;
  url: string;
  fetchedAt: string;
  scores: { performance: number; accessibility: number; bestPractices: number; seo: number };
  raw: Record<string, { score: number | null; title?: string }> | undefined;
};

type HealthFailure = {
  ok: false;
  error: string;
  fetchedAt: string;
};

type HealthResult = HealthSuccess | HealthFailure;

/* ─── Health-Check: Hardcoded PSI fetch ─── */
async function fetchHealthCheck(targetUrl: string): Promise<HealthResult> {
  try {
    const { data } = await psi(targetUrl, {
      key: process.env.VITALS_PAGESPEED_API_KEY,
      strategy: "mobile",
    });

    const categories = data.lighthouseResult?.categories;
    const scores = {
      performance: Math.round(
        (categories?.performance?.score ?? 0) * 100
      ),
      accessibility: Math.round(
        (categories?.accessibility?.score ?? 0) * 100
      ),
      bestPractices: Math.round(
        (categories?.["best-practices"]?.score ?? 0) * 100
      ),
      seo: Math.round((categories?.seo?.score ?? 0) * 100),
    };

    const result: HealthSuccess = {
      ok: true as const,
      url: data.id,
      fetchedAt: new Date().toISOString(),
      scores,
      raw: data.lighthouseResult?.categories,
    };

    // Persist to Supabase (fire-and-forget — don't block the render)
    saveScan({
      url: data.id,
      strategy: "mobile",
      score_performance: scores.performance,
      score_accessibility: scores.accessibility,
      score_best_practices: scores.bestPractices,
      score_seo: scores.seo,
      raw_categories: data.lighthouseResult?.categories as Record<string, unknown> ?? null,
    }).catch((err) => console.error("[supabase] saveScan failed:", err));

    return result;
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
      fetchedAt: new Date().toISOString(),
    };
  }
}

/* ─── Score Color Helper ─── */
function scoreColor(score: number): string {
  if (score >= 90) return "text-accent";
  if (score >= 50) return "text-warning";
  return "text-danger";
}

function scoreBg(score: number): string {
  if (score >= 90) return "bg-accent/10 border-accent/30";
  if (score >= 50) return "bg-warning/10 border-warning/30";
  return "bg-danger/10 border-danger/30";
}

/* ─── Page Component ─── */
export default async function HomePage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const urlParam = searchParams.url;
  const targetUrl = typeof urlParam === 'string' && urlParam ? urlParam : "https://vercel.com";

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 sm:py-20 gap-16">
      {/* Hero Section */}
      <section className="max-w-3xl w-full text-center" id="hero">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-muted mb-6">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Week 3 Capstone — Scaffold Ready
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 leading-[1.1]">
          Audit your site&rsquo;s{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Web Vitals
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-muted max-w-xl mx-auto mb-8">
          Enter any URL to get a performance score, SEO audit, and
          AI‑powered optimization summary. Coming soon.
        </p>

        {/* URL Input Form */}
        <form action="/" method="GET" className="max-w-lg mx-auto flex items-center gap-2 p-1.5 rounded-2xl glass">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 text-foreground text-sm">
            <svg
              className="w-4 h-4 shrink-0 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="url"
              name="url"
              defaultValue={targetUrl}
              placeholder="https://example.com"
              required
              className="w-full bg-transparent outline-none placeholder:text-muted"
            />
          </div>
          <button type="submit" className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Scan
          </button>
        </form>
      </section>

      {/* Health Check Section */}
      <section className="max-w-4xl w-full" id="health-check">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              PSI Health Check
            </h2>
            <p className="text-sm text-muted">
              Live PageSpeed Insights fetch for {targetUrl}
            </p>
          </div>
        </div>

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted animate-pulse">Running Lighthouse audit... this may take 10-15 seconds.</p>
          </div>
        }>
          <HealthCheckResults targetUrl={targetUrl} />
        </Suspense>
      </section>
    </main>
  );
}

async function HealthCheckResults({ targetUrl }: { targetUrl: string }) {
  const health = await fetchHealthCheck(targetUrl);
  
  if (!health.ok) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center">
        <p className="text-danger font-semibold mb-1">
          Health check failed
        </p>
        <p className="text-sm text-muted">
          {health.error}
        </p>
        <p className="text-xs text-muted mt-2">
          Fetched: {health.fetchedAt}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(
          [
            ["Performance", health.scores.performance],
            ["Accessibility", health.scores.accessibility],
            ["Best Practices", health.scores.bestPractices],
            ["SEO", health.scores.seo],
          ] as const
        ).map(([label, score]) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 text-center transition-all duration-200 ${scoreBg(score)}`}
          >
            <p
              className={`text-3xl sm:text-4xl font-bold tabular-nums ${scoreColor(score)}`}
            >
              {score}
            </p>
            <p className="text-xs text-muted mt-1 font-medium">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-4 text-xs text-muted mb-4">
        <span>
          URL:{" "}
          <code className="px-2 py-0.5 rounded bg-surface font-mono text-accent">
            {health.url}
          </code>
        </span>
        <span>
          Fetched:{" "}
          <code className="px-2 py-0.5 rounded bg-surface font-mono">
            {health.fetchedAt}
          </code>
        </span>
      </div>

      {/* Raw JSON */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-muted hover:text-foreground transition-colors select-none flex items-center gap-2">
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          View raw category JSON
        </summary>
        <pre className="mt-3 p-4 rounded-2xl bg-surface border border-border overflow-x-auto text-xs text-muted font-mono leading-relaxed max-h-96">
          {JSON.stringify(health.raw, null, 2)}
        </pre>
      </details>
    </>
  );
}

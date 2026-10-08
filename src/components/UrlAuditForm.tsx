"use client";

/**
 * UrlAuditForm — client component for the fast progressive scan pipeline:
 *   - Fast <300ms submission to POST /api/scan
 *   - Progressive polling every 2s with multi-phase rendering:
 *       Phase 1: Direct HTML quick checks (Title, Description, H1, Canonical, Robots, Image Alt)
 *       Phase 2: Core Web Vitals & Lighthouse score gauges with per-gauge loading states
 *       Phase 3: Gemini Flash summary
 *   - 24-hour cache reuse with a dedicated "Re-scan" action that bypasses the cache
 *   - 90-second stuck-in-running fallback detector
 *   - Rotating dynamic SEO loading tips while background work executes
 */

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ScanRow, QuickChecks, ScanTimings } from "@/lib/supabase/scans";
import SeoLoadingTips from "@/components/SeoLoadingTips";

/* ─── Validation Helpers ─── */
function isValidUrl(value: string): boolean {
  try {
    const raw = value.trim();
    if (!raw) return false;
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(withProtocol);
    if (!u.hostname.includes(".")) return false;
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

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

/* ─── Quick Checks Component (Phase 1) ─── */
function QuickChecksCard({ quickChecks }: { quickChecks: QuickChecks }) {
  return (
    <div className="mb-6 rounded-2xl border border-border bg-surface p-5 text-left transition-all duration-200">
      <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
        <span className="font-mono text-[10px] tracking-[.12em] text-[#B87E2F]">
          PHASE 1 / DIRECT HTML SIGNALS
        </span>
        <span className="font-mono text-[9px] text-muted">COMPLETED ~1-2S</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-surface-hover/30 p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted">Page Title</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
            {quickChecks.title || <span className="text-danger italic">Missing &lt;title&gt; tag</span>}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface-hover/30 p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted">Meta Description</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
            {quickChecks.description || <span className="text-danger italic">Missing meta description</span>}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface-hover/30 p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted">H1 Heading</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
            {quickChecks.h1 ? (
              <span>
                {quickChecks.h1}{" "}
                <span className="font-mono text-[10px] text-muted">({quickChecks.h1Count} found)</span>
              </span>
            ) : (
              <span className="text-danger italic">No &lt;h1&gt; found</span>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface-hover/30 p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted">Canonical URL</p>
          <p className="mt-1 truncate font-mono text-[11px] text-foreground">
            {quickChecks.canonical || <span className="text-muted italic">Self / none specified</span>}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface-hover/30 p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted">Robots Directives</p>
          <p className="mt-1 font-mono text-[11px] text-foreground">
            {quickChecks.robots || <span className="text-muted italic">Index, follow (default)</span>}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface-hover/30 p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted">Image Alt Coverage</p>
          <p className="mt-1 text-xs font-medium text-foreground">
            {quickChecks.imageAlt.total === 0 ? (
              <span className="text-muted italic">No images on page</span>
            ) : (
              <span>
                <strong className={quickChecks.imageAlt.percent >= 90 ? "text-accent" : "text-warning"}>
                  {quickChecks.imageAlt.percent}%
                </strong>{" "}
                <span className="font-mono text-[10px] text-muted">
                  ({quickChecks.imageAlt.withAlt}/{quickChecks.imageAlt.total} with alt)
                </span>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Score Cards with Loading States ─── */
function ScoreCards({
  scores,
  loading = false,
}: {
  scores?: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  loading?: boolean;
}) {
  const cards = [
    { label: "Performance", score: scores?.performance },
    { label: "Accessibility", score: scores?.accessibility },
    { label: "Best Practices", score: scores?.bestPractices },
    { label: "SEO", score: scores?.seo },
  ];

  return (
    <div className="overflow-x-auto -mx-1 px-1 mb-6">
      <div className="flex sm:grid sm:grid-cols-4 gap-3 min-w-max sm:min-w-0">
        {cards.map(({ label, score }) => {
          const isScoreLoaded = score !== null && score !== undefined && !loading;
          return (
            <div
              key={label}
              className={`rounded-2xl border p-4 text-center transition-all duration-200 w-36 sm:w-auto ${
                isScoreLoaded ? scoreBg(score) : "border-border bg-surface/40"
              }`}
            >
              {isScoreLoaded ? (
                <>
                  <p className={`text-3xl sm:text-4xl font-bold tabular-nums ${scoreColor(score)}`}>
                    {score}
                  </p>
                  <p className="text-xs text-muted mt-1 font-medium">{label}</p>
                </>
              ) : (
                <div className="animate-pulse">
                  <div className="h-10 bg-border/40 rounded-lg mb-2 mx-auto w-16" />
                  <div className="h-3 bg-border/30 rounded w-20 mx-auto" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Timings Instrument Readout ─── */
function TimingsBadge({ timings }: { timings: ScanTimings }) {
  const p1 = timings.phase1Ms ? `${(timings.phase1Ms / 1000).toFixed(1)}s` : null;
  const p2 = timings.phase2Ms ? `${(timings.phase2Ms / 1000).toFixed(1)}s` : null;
  const p3 = timings.phase3Ms ? `${(timings.phase3Ms / 1000).toFixed(1)}s` : null;
  const total = timings.totalMs ? `${(timings.totalMs / 1000).toFixed(1)}s` : null;

  return (
    <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] tracking-wider text-muted border-t border-border/40 pt-3 mt-4">
      <span>TIMINGS:</span>
      {p1 && <span>P1 HTML: <strong className="text-foreground">{p1}</strong></span>}
      {p2 && <span>P2 PSI: <strong className="text-foreground">{p2}</strong></span>}
      {p3 && <span>P3 AI: <strong className="text-foreground">{p3}</strong></span>}
      {total && <span>TOTAL: <strong className="text-[#E8A33D]">{total}</strong></span>}
    </div>
  );
}

/* ─── Main Component ─── */
export default function UrlAuditForm({ initialScan }: { initialScan?: ScanRow }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [urlValue, setUrlValue] = useState(initialScan?.url || "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [currentScan, setCurrentScan] = useState<ScanRow | null>(initialScan || null);
  const [polling, setPolling] = useState(false);
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with initialScan when prop changes
  useEffect(() => {
    if (initialScan) {
      setCurrentScan(initialScan);
      setUrlValue(initialScan.url);
    }
  }, [initialScan]);

  /* Polling loop for active scan */
  const scanId = currentScan?.id;
  const scanStatus = currentScan?.status || (currentScan?.score_performance !== null ? "done" : "idle");

  const checkScanStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/scan/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json() as { ok: boolean; scan?: ScanRow };
      if (data.ok && data.scan) {
        setCurrentScan(data.scan);

        // Stop polling if done or failed
        if (data.scan.status === "done" || data.scan.status === "failed") {
          setPolling(false);
        }
      }
    } catch (err) {
      console.warn("Poll fetch warning:", err);
    }
  }, []);

  useEffect(() => {
    if (!polling || !scanId) return;

    // Check immediately, then poll every 2s
    checkScanStatus(scanId);

    const interval = setInterval(() => {
      // 90s timeout check
      if (scanStartTime && Date.now() - scanStartTime > 90000) {
        setPolling(false);
        setCurrentScan((prev) =>
          prev
            ? {
                ...prev,
                status: "failed",
                error_text: "Audit timed out after 90 seconds. Please try again.",
              }
            : null
        );
        return;
      }

      checkScanStatus(scanId);
    }, 2000);

    return () => clearInterval(interval);
  }, [polling, scanId, scanStartTime, checkScanStatus]);

  const handleBlur = () => {
    if (urlValue && !isValidUrl(urlValue)) {
      setUrlError("Please enter a valid URL starting with https://");
    } else {
      setUrlError(null);
    }
  };

  const runAudit = async (rawUrl: string, force = false) => {
    const trimmed = rawUrl.trim();
    const formattedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    setUrlError(null);
    setScanStartTime(Date.now());

    // Reset current scan state for new run if forced
    if (force) {
      setCurrentScan(null);
    }

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formattedUrl, strategy: "mobile", force }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setUrlError(data.error || "Failed to start scan.");
        return;
      }

      // Record scan in localStorage
      try {
        const recent = JSON.parse(localStorage.getItem("recentScans") || "[]");
        const updated = [data.id, ...recent.filter((id: string) => id !== data.id)].slice(0, 10);
        localStorage.setItem("recentScans", JSON.stringify(updated));
        localStorage.setItem("vitals.scanId", data.id);
      } catch (err) {
        console.error("Failed to save to localStorage", err);
      }

      // Fetch scan row immediately
      await checkScanStatus(data.id);

      // If not yet finished, start polling
      if (data.status !== "done") {
        setPolling(true);
      }

      // Update URL search query
      router.push(`/?scan=${encodeURIComponent(data.id)}`);
    } catch {
      setUrlError("Network error — could not reach the audit service. Please try again.");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = urlValue.trim();

    if (!trimmed) {
      setUrlError("Please enter a URL.");
      inputRef.current?.focus();
      return;
    }
    if (!isValidUrl(trimmed)) {
      setUrlError("Please enter a valid URL starting with https://");
      inputRef.current?.focus();
      return;
    }

    runAudit(trimmed, false);
  };

  const handleRescan = () => {
    const target = currentScan?.url || urlValue;
    if (target && isValidUrl(target)) {
      runAudit(target, true);
    }
  };

  const isLoading = polling || scanStatus === "pending" || scanStatus === "running";
  const isFailed = scanStatus === "failed";
  const isDone = scanStatus === "done" || (currentScan?.score_performance !== null && !isLoading);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* ─── URL Input Form ─── */}
      <form onSubmit={handleSubmit} noValidate className="mb-3">
        <div
          className={`flex items-center gap-2 p-1.5 rounded-2xl glass transition-all duration-200 ${
            urlError ? "ring-2 ring-danger/60" : "ring-0"
          }`}
        >
          <div className="flex-1 flex items-center gap-2 px-4 py-2 text-foreground text-base">
            <svg
              className="w-4 h-4 shrink-0 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              id="audit-url-input"
              type="url"
              value={urlValue}
              onChange={(e) => {
                setUrlValue(e.target.value);
                if (urlError) setUrlError(null);
              }}
              onBlur={handleBlur}
              placeholder="https://example.com"
              autoComplete="url"
              aria-label="Website URL to audit"
              aria-describedby={urlError ? "url-error" : undefined}
              aria-invalid={!!urlError}
              disabled={isLoading}
              className="w-full bg-transparent outline-none placeholder:text-muted disabled:opacity-60 font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            id="audit-submit-btn"
            disabled={isLoading}
            aria-busy={isLoading}
            className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {isLoading ? "Scanning…" : "Scan"}
          </button>
        </div>

        {urlError && (
          <p id="url-error" role="alert" className="mt-2 text-sm text-danger flex items-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {urlError}
          </p>
        )}
      </form>

      {/* ─── Loading & Progressive Progress Area ─── */}
      {isLoading && (
        <div className="mt-6 text-left" aria-live="polite" aria-label="Audit in progress">
          <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
            <div className="flex items-center gap-2.5 font-mono text-xs text-muted">
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>
                {currentScan?.quick_checks
                  ? "Phase 2: Running PageSpeed Insights audit…"
                  : "Phase 1: Fetching direct HTML & meta tags…"}
              </span>
            </div>
            <span className="font-mono text-[9px] text-[#E8A33D] tracking-wider">
              {currentScan?.quick_checks ? "PROGRESSIVE / PSI RUNNING" : "PROGRESSIVE / HTML FETCH"}
            </span>
          </div>

          <SeoLoadingTips />

          {/* If Phase 1 quick checks are ready, show them immediately during Phase 2! */}
          {currentScan?.quick_checks && <QuickChecksCard quickChecks={currentScan.quick_checks} />}

          {/* Per-gauge loading skeleton */}
          <ScoreCards
            scores={{
              performance: currentScan?.score_performance ?? null,
              accessibility: currentScan?.score_accessibility ?? null,
              bestPractices: currentScan?.score_best_practices ?? null,
              seo: currentScan?.score_seo ?? null,
            }}
            loading={currentScan?.score_performance === null}
          />
        </div>
      )}

      {/* ─── Error State with Retry ─── */}
      {isFailed && (
        <div role="alert" className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 p-6 text-left">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-danger shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-danger font-semibold text-sm mb-1">Audit Failed</p>
              <p className="text-sm text-danger/80 mb-3 leading-relaxed">
                {currentScan?.error_text || "The audit service encountered an issue. Please try again."}
              </p>
              <button
                onClick={() => runAudit(urlValue || currentScan?.url || "", true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-danger/20 hover:bg-danger/30 text-danger text-sm font-semibold transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!isLoading && !isFailed && !currentScan && (
        <div className="mt-12 flex flex-col items-center text-center gap-4 text-muted">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-medium text-foreground">No audit yet</p>
            <p className="text-sm mt-1 mb-4 max-w-xs mx-auto">
              Paste any URL above and click <strong>Scan</strong> to get a PageSpeed score, SEO report, and AI-powered recommendations.
            </p>
            <button
              type="button"
              onClick={() => {
                setUrlValue("https://vercel.com");
                if (urlError) setUrlError(null);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="text-sm text-primary hover:text-primary-light font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              Try an example: https://vercel.com
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ─── Completed Results ─── */}
      {!isLoading && isDone && currentScan && (
        <div className="mt-8 text-left animate-in fade-in duration-300">
          {/* Header bar with Re-scan button */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              <span>
                URL:{" "}
                <code className="px-2 py-0.5 rounded bg-surface font-mono text-accent">
                  {currentScan.url}
                </code>
              </span>
              <span>
                Audited:{" "}
                <code className="px-2 py-0.5 rounded bg-surface font-mono">
                  {new Date(currentScan.created_at).toLocaleTimeString()}
                </code>
              </span>
            </div>
            <button
              type="button"
              onClick={handleRescan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover font-mono text-xs text-foreground transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-scan (bypasses cache)
            </button>
          </div>

          {/* Quick Checks (Phase 1) */}
          {currentScan.quick_checks && <QuickChecksCard quickChecks={currentScan.quick_checks} />}

          {/* Score Cards (Phase 2) */}
          <ScoreCards
            scores={{
              performance: currentScan.score_performance,
              accessibility: currentScan.score_accessibility,
              bestPractices: currentScan.score_best_practices,
              seo: currentScan.score_seo,
            }}
          />

          {/* AI Summary Card (Phase 3) */}
          {currentScan.summary && (
            <div className="mb-6 rounded-2xl border border-[#AEB4BA] bg-surface p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
                <span className="font-mono text-[10px] tracking-[.12em] text-[#B87E2F]">
                  PHASE 3 / GEMINI FLASH SUMMARY
                </span>
                <span className="font-mono text-[9px] text-muted">AI-GENERATED SYNTHESIS</span>
              </div>
              <div className="prose prose-sm text-foreground max-w-none leading-relaxed whitespace-pre-wrap">
                {currentScan.summary}
              </div>
            </div>
          )}

          {/* Timings Instrument */}
          {currentScan.timings && <TimingsBadge timings={currentScan.timings} />}

          {/* Raw JSON Accordion */}
          {currentScan.raw_categories && (
            <details className="group mt-4">
              <summary className="cursor-pointer text-xs text-muted hover:text-foreground transition-colors select-none flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5 transition-transform group-open:rotate-90"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                View raw audit category JSON
              </summary>
              <pre className="mt-3 p-4 rounded-xl bg-[#2B2E33] text-[#E8E9EB] border border-border overflow-x-auto text-xs font-mono leading-relaxed max-h-80">
                {JSON.stringify(currentScan.raw_categories, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

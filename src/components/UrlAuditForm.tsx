"use client";

/**
 * UrlAuditForm — client component that owns all interactive audit behaviour:
 *   - URL input validation (item 1)
 *   - Loading skeleton while PSI runs (item 2)
 *   - Disabled submit button during in-flight request (item 3)
 *   - Error state with retry action (item 4)
 *   - Empty state before any audit (item 6)
 *   - Mobile-safe scrollable score cards (item 8)
 */

import { useState, useRef, type FormEvent } from "react";
import type { AuditResult } from "@/app/api/audit/route";

/* ─── Helpers ─── */
function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
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

/* ─── Sub-components ─── */
function ScoreSkeleton() {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex sm:grid sm:grid-cols-4 gap-3 mb-6 min-w-max sm:min-w-0">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface/40 p-4 text-center w-36 sm:w-auto animate-pulse"
          >
            <div className="h-10 bg-border/40 rounded-lg mb-2 mx-auto w-16" />
            <div className="h-3 bg-border/30 rounded w-20 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface Scores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

function ScoreCards({ scores }: { scores: Scores }) {
  return (
    /* Horizontal scroll on mobile so cards never wrap to a broken layout */
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex sm:grid sm:grid-cols-4 gap-3 mb-6 min-w-max sm:min-w-0">
        {(
          [
            ["Performance", scores.performance],
            ["Accessibility", scores.accessibility],
            ["Best Practices", scores.bestPractices],
            ["SEO", scores.seo],
          ] as const
        ).map(([label, score]) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 text-center transition-all duration-200 w-36 sm:w-auto ${scoreBg(score)}`}
          >
            <p className={`text-3xl sm:text-4xl font-bold tabular-nums ${scoreColor(score)}`}>
              {score}
            </p>
            <p className="text-xs text-muted mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function UrlAuditForm() {
  const [urlValue, setUrlValue] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<AuditResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Validate on blur so we don't yell while the user is still typing */
  const handleBlur = () => {
    if (urlValue && !isValidUrl(urlValue)) {
      setUrlError("Please enter a valid URL starting with https:// or http://");
    } else {
      setUrlError(null);
    }
  };

  const runAudit = async (url: string) => {
    setStatus("loading");
    setResult(null);
    setUrlError(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data: AuditResult = await res.json();
      setResult(data);
      setStatus(data.ok ? "success" : "error");
    } catch {
      setResult({
        ok: false,
        error: "Network error — could not reach the audit service. Please try again.",
        fetchedAt: new Date().toISOString(),
      });
      setStatus("error");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = urlValue.trim();

    /* 1. Inline validation — catch bad input before touching the API */
    if (!trimmed) {
      setUrlError("Please enter a URL.");
      inputRef.current?.focus();
      return;
    }
    if (!isValidUrl(trimmed)) {
      setUrlError("Please enter a valid URL starting with https:// or http://");
      inputRef.current?.focus();
      return;
    }

    runAudit(trimmed);
  };

  const handleRetry = () => {
    const trimmed = urlValue.trim();
    if (trimmed && isValidUrl(trimmed)) runAudit(trimmed);
  };

  const isLoading = status === "loading";

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* ─── URL Input Form ─── */}
      <form onSubmit={handleSubmit} noValidate className="mb-3">
        <div
          className={`flex items-center gap-2 p-1.5 rounded-2xl glass transition-all duration-200 ${
            urlError ? "ring-2 ring-danger/60" : "ring-0"
          }`}
        >
          <div className="flex-1 flex items-center gap-2 px-4 py-2 text-foreground text-sm">
            <svg
              className="w-4 h-4 shrink-0 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              id="audit-url-input"
              type="url"
              value={urlValue}
              onChange={(e) => {
                setUrlValue(e.target.value);
                if (urlError) setUrlError(null); // clear error on edit
              }}
              onBlur={handleBlur}
              placeholder="https://example.com"
              autoComplete="url"
              aria-label="Website URL to audit"
              aria-describedby={urlError ? "url-error" : undefined}
              aria-invalid={!!urlError}
              disabled={isLoading}
              className="w-full bg-transparent outline-none placeholder:text-muted disabled:opacity-60"
            />
          </div>
          {/* 3. Disabled while in-flight */}
          <button
            type="submit"
            id="audit-submit-btn"
            disabled={isLoading}
            aria-busy={isLoading}
            className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
          >
            {/* 2. Show spinner in button while loading */}
            {isLoading && (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {isLoading ? "Scanning…" : "Scan"}
          </button>
        </div>

        {/* 1. Inline validation error */}
        {urlError && (
          <p
            id="url-error"
            role="alert"
            className="mt-2 text-sm text-danger flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {urlError}
          </p>
        )}
      </form>

      {/* ─── Results area ─── */}

      {/* 2. Loading skeleton */}
      {isLoading && (
        <div className="mt-8" aria-live="polite" aria-label="Audit in progress">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted animate-pulse text-sm">
              Running Lighthouse audit — this takes 10–20 seconds…
            </p>
          </div>
          <ScoreSkeleton />
          {/* Skeleton lines for raw output */}
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 bg-border/30 rounded animate-pulse" style={{ width: `${80 - i * 12}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* 6. Empty state — shown before any audit has been run */}
      {status === "idle" && (
        <div className="mt-12 flex flex-col items-center text-center gap-4 text-muted">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-medium text-foreground">No audit yet</p>
            <p className="text-sm mt-1 max-w-xs">
              Paste any URL above and click <strong>Scan</strong> to get a PageSpeed score, SEO report, and AI-powered recommendations.
            </p>
          </div>
        </div>
      )}

      {/* 4. Error state with retry */}
      {status === "error" && result && !result.ok && (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 p-6"
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-danger shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-danger font-semibold text-sm mb-1">Audit failed</p>
              <p className="text-sm text-muted mb-3">{result.error}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-danger/20 hover:bg-danger/30 text-danger text-sm font-semibold transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success results */}
      {status === "success" && result && result.ok && (
        <div className="mt-8">
          {/* 8. Score cards in horizontal-scroll container */}
          <ScoreCards scores={result.scores} />

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-xs text-muted mb-4">
            <span>
              URL:{" "}
              <code className="px-2 py-0.5 rounded bg-surface font-mono text-accent">
                {result.url}
              </code>
            </span>
            <span>
              Fetched:{" "}
              <code className="px-2 py-0.5 rounded bg-surface font-mono">
                {result.fetchedAt}
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
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              View raw category JSON
            </summary>
            <pre className="mt-3 p-4 rounded-2xl bg-surface border border-border overflow-x-auto text-xs text-muted font-mono leading-relaxed max-h-96">
              {JSON.stringify(result.raw, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

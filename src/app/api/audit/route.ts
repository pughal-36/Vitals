import { NextResponse } from "next/server";
import psi from "psi";
import { saveScan } from "@/lib/supabase/scans";

export interface AuditSuccess {
  ok: true;
  url: string;
  fetchedAt: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  raw: Record<string, { score: number | null; title?: string }> | undefined;
}

export interface AuditFailure {
  ok: false;
  error: string;
  fetchedAt: string;
}

export type AuditResult = AuditSuccess | AuditFailure;

export async function POST(req: Request) {
  const { url, strategy = "mobile" }: { url: string; strategy?: string } =
    await req.json();

  // Server-side URL validation — belt-and-suspenders on top of client check.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid URL.", fetchedAt: new Date().toISOString() },
      { status: 400 }
    );
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json(
      {
        ok: false,
        error: "URL must start with http:// or https://.",
        fetchedAt: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  const rawStrategy = strategy;
  const resolvedStrategy: "mobile" | "desktop" =
    rawStrategy === "desktop" ? "desktop" : "mobile";

  try {
    // VITALS_PAGESPEED_API_KEY is a server-only env var — never exposed to the browser.
    const { data } = await psi(url, {
      key: process.env.VITALS_PAGESPEED_API_KEY,
      strategy: resolvedStrategy,
    });

    const categories = data.lighthouseResult?.categories;
    const scores = {
      performance: Math.round((categories?.performance?.score ?? 0) * 100),
      accessibility: Math.round(
        (categories?.accessibility?.score ?? 0) * 100
      ),
      bestPractices: Math.round(
        (categories?.["best-practices"]?.score ?? 0) * 100
      ),
      seo: Math.round((categories?.seo?.score ?? 0) * 100),
    };

    const result: AuditSuccess = {
      ok: true,
      url: data.id,
      fetchedAt: new Date().toISOString(),
      scores,
      raw: data.lighthouseResult?.categories,
    };

    // Persist to Supabase — fire-and-forget.
    saveScan({
      url: data.id,
      strategy,
      score_performance: scores.performance,
      score_accessibility: scores.accessibility,
      score_best_practices: scores.bestPractices,
      score_seo: scores.seo,
      raw_categories:
        (data.lighthouseResult?.categories as Record<string, unknown>) ?? null,
    }).catch((err) => console.error("[supabase] saveScan failed:", err));

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error from PageSpeed API.";
    const result: AuditFailure = {
      ok: false,
      error: message,
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(result, { status: 502 });
  }
}

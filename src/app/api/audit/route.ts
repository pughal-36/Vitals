import { NextResponse } from "next/server";
import { saveScan } from "@/lib/supabase/scans";

export interface AuditSuccess {
  ok: true;
  id: string;
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
    const apiKey = process.env.VITALS_PAGESPEED_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "PageSpeed API key is not configured.", fetchedAt: new Date().toISOString() },
        { status: 500 }
      );
    }

    const params = new URLSearchParams();
    params.set("url", url);
    params.set("strategy", resolvedStrategy);
    params.set("key", apiKey);
    params.append("category", "performance");
    params.append("category", "accessibility");
    params.append("category", "best-practices");
    params.append("category", "seo");

    const psiRes = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`,
      {
        signal: AbortSignal.timeout(45000),
        headers: { Accept: "application/json" },
      }
    );

    if (!psiRes.ok) {
      return NextResponse.json(
        { ok: false, error: `PageSpeed API error: ${psiRes.statusText}`, fetchedAt: new Date().toISOString() },
        { status: psiRes.status }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await psiRes.json()) as any;
    const categories = data.lighthouseResult?.categories;
    const scores = {
      performance: Math.round((categories?.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories?.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((categories?.["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((categories?.seo?.score ?? 0) * 100),
    };

    type AuditEntry = { id?: string; title?: string; description?: string; score?: number | null; displayValue?: string | null };
    const failingAudits = (Object.values(data.lighthouseResult?.audits || {}) as AuditEntry[])
      .filter((a): a is AuditEntry & { id: string; title: string; score: number } =>
        Boolean(a && a.id && a.title && a.score !== null && a.score !== undefined && a.score < 1)
      )
      .map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description || "",
        score: a.score,
        displayValue: a.displayValue || null,
      }));

    const rawCategoriesPayload = {
      categories: data.lighthouseResult?.categories || {},
      failingAudits
    };

    // Persist to Supabase
    const savedScan = await saveScan({
      url: data.id,
      strategy,
      score_performance: scores.performance,
      score_accessibility: scores.accessibility,
      score_best_practices: scores.bestPractices,
      score_seo: scores.seo,
      raw_categories: rawCategoriesPayload,
    });

    const result = {
      ok: true as const,
      id: savedScan.id,
      url: data.id,
      fetchedAt: new Date().toISOString(),
      scores,
      raw: rawCategoriesPayload,
    };

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

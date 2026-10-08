import { NextResponse } from "next/server";
import { after } from "next/server";
import { validateAndNormalizeUrl } from "@/lib/scanner/url";
import { checkRateLimit, getClientIp } from "@/lib/scanner/rate-limit";
import { createPendingScan, findRecentScan, getScanById } from "@/lib/supabase/scans";
import { runScanPipeline } from "@/lib/scanner/pipeline";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Rate limit exceeded. Please wait a minute before requesting another audit.",
        code: "rate_limit",
      },
      { status: 429 }
    );
  }

  let body: { url?: string; strategy?: string; force?: boolean; rescan?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request JSON payload." },
      { status: 400 }
    );
  }

  const { url, strategy = "mobile", force = false, rescan = false } = body;

  if (!url) {
    return NextResponse.json(
      { ok: false, error: "URL is required." },
      { status: 400 }
    );
  }

  // Validate and normalize URL (https only, SSRF blocked)
  const validation = validateAndNormalizeUrl(url);
  if (!validation.valid) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  const normalizedUrl = validation.normalizedUrl;
  const resolvedStrategy: "mobile" | "desktop" =
    strategy === "desktop" ? "desktop" : "mobile";

  const bypassCache = Boolean(force || rescan);

  // ─── Cache Check (24h reuse) ───
  if (!bypassCache) {
    try {
      const existing = await findRecentScan(normalizedUrl, resolvedStrategy, 24);
      if (existing) {
        // If it's already done, return cached scan immediately
        if (existing.status === "done" || (existing.score_performance !== null && !existing.status)) {
          return NextResponse.json({
            ok: true,
            id: existing.id,
            status: "done",
            cached: true,
          });
        }

        // If it's currently in progress and was created recently (< 90s), reuse the in-flight scan
        if (
          (existing.status === "running" || existing.status === "pending") &&
          Date.now() - new Date(existing.created_at).getTime() < 90000
        ) {
          return NextResponse.json({
            ok: true,
            id: existing.id,
            status: existing.status,
            cached: true,
          });
        }
      }
    } catch (cacheErr) {
      console.warn("Cache check warning:", cacheErr);
    }
  }

  // ─── Create Pending Scan Row (<300ms) ───
  try {
    const scan = await createPendingScan(normalizedUrl, resolvedStrategy);

    // Schedule background pipeline work via after()
    after(async () => {
      await runScanPipeline(scan.id, normalizedUrl, resolvedStrategy);
    });

    return NextResponse.json(
      {
        ok: true,
        id: scan.id,
        status: "pending",
        cached: false,
      },
      { status: 202 }
    );
  } catch (err) {
    console.error("Failed to initiate scan:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to create audit job. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const singleId = searchParams.get("id");
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];

  if (singleId) {
    const scan = await getScanById(singleId);
    if (!scan) {
      return NextResponse.json({ ok: false, error: "Scan not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, scan });
  }

  if (ids.length === 0) {
    return NextResponse.json({ scans: [] });
  }

  const scans = [];
  try {
    for (const id of ids) {
      if (id) {
        const scan = await getScanById(id);
        if (scan) scans.push(scan);
      }
    }
  } catch (error) {
    console.error("Could not restore requested scans", error);
  }

  return NextResponse.json({ scans });
}

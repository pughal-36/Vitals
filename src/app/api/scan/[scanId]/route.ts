import { NextResponse } from "next/server";
import { getScanById, updateScan } from "@/lib/supabase/scans";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  if (!scanId) {
    return NextResponse.json({ ok: false, error: "Scan ID is required." }, { status: 400 });
  }

  const scan = await getScanById(scanId);
  if (!scan) {
    return NextResponse.json({ ok: false, error: "Scan not found." }, { status: 404 });
  }

  // If a row has been "pending" or "running" for more than 90 seconds, fail it to stop polling
  if (scan.status === "pending" || scan.status === "running") {
    const createdAtMs = new Date(scan.created_at).getTime();
    const elapsedMs = Date.now() - createdAtMs;
    if (elapsedMs > 90 * 1000) {
      const timeoutMessage = "The scan did not finish. Try again.";
      scan.status = "failed";
      scan.error_text = timeoutMessage;

      try {
        await updateScan(scanId, {
          status: "failed",
          error_text: timeoutMessage,
        });
      } catch (err) {
        console.error(`[scan] Failed to update timed out scan ${scanId}:`, err);
      }

      return NextResponse.json({ ok: true, scan });
    }
  }

  return NextResponse.json({ ok: true, scan });
}

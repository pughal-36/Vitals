import { NextResponse } from "next/server";
import { getScanById } from "@/lib/supabase/scans";

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

  return NextResponse.json({ ok: true, scan });
}

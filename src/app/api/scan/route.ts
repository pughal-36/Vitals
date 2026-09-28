import { NextResponse } from "next/server";
import { getScanById } from "@/lib/supabase/scans";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids")?.split(",") || [];
  
  if (ids.length === 0) {
    return NextResponse.json({ scans: [] });
  }

  const scans = [];
  for (const id of ids) {
    if (id) {
      const scan = await getScanById(id);
      if (scan) scans.push(scan);
    }
  }

  return NextResponse.json({ scans });
}

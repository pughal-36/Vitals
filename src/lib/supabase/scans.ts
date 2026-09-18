// ─── Supabase helpers for scans ────────────────────────────────
// We use `as any` casts on .from() because the supabase-js client
// is not typed against our schema (no generated types file yet).
// Once you run `supabase gen types` and commit the output, replace
// `as any` with the proper Database generic.
import { getSupabaseClient } from "./client";

export type ScanRow = {
  id: string;
  created_at: string;
  url: string;
  strategy: string;
  score_performance: number | null;
  score_accessibility: number | null;
  score_best_practices: number | null;
  score_seo: number | null;
  raw_categories: Record<string, unknown> | null;
};

export type ScanInsert = Omit<ScanRow, "id" | "created_at">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (getSupabaseClient() as any).from("scans");

/** Save a completed PageSpeed audit to Supabase. Returns the new row. */
export async function saveScan(scan: ScanInsert): Promise<ScanRow> {
  const { data, error } = await table().insert(scan).select().single();
  if (error) throw new Error(`Failed to save scan: ${error.message}`);
  return data as ScanRow;
}

/** Fetch the most recent N scans (for the history page). */
export async function listScans(limit = 50): Promise<ScanRow[]> {
  const { data, error } = await table()
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to fetch scans: ${error.message}`);
  return (data ?? []) as ScanRow[];
}

/** Fetch a single scan by ID (for the report page). */
export async function getScanById(id: string): Promise<ScanRow | null> {
  const { data, error } = await table().select("*").eq("id", id).single();
  if (error) return null;
  return data as ScanRow;
}

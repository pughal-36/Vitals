import { getSupabaseClient } from "./client";

export type QuickChecks = {
  title: string | null;
  description: string | null;
  h1: string | null;
  h1Count: number;
  canonical: string | null;
  robots: string | null;
  imageAlt: {
    total: number;
    withAlt: number;
    missingAlt: number;
    percent: number;
  };
};

export type ScanTimings = {
  phase1Ms?: number;
  phase2Ms?: number;
  phase3Ms?: number;
  totalMs?: number;
};

export type ScanRow = {
  id: string;
  created_at: string;
  url: string;
  strategy: string;
  status?: "pending" | "running" | "done" | "failed";
  score_performance: number | null;
  score_accessibility: number | null;
  score_best_practices: number | null;
  score_seo: number | null;
  quick_checks?: QuickChecks | null;
  summary?: string | null;
  error_text?: string | null;
  timings?: ScanTimings | null;
  updated_at?: string | null;
  raw_categories: Record<string, unknown> | null;
};

export type ScanInsert = Omit<ScanRow, "id" | "created_at">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (getSupabaseClient() as any).from("scans");

/** Look for a recent completed or running scan for the given URL and strategy within maxAgeHours */
export async function findRecentScan(
  url: string,
  strategy = "mobile",
  maxAgeHours = 24
): Promise<ScanRow | null> {
  try {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
    const { data, error } = await table()
      .select("*")
      .eq("url", url)
      .eq("strategy", strategy)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0] as ScanRow;
  } catch (error) {
    console.error("Error finding recent scan:", error);
    return null;
  }
}

/** Create a new scan row in pending status. Degrades gracefully if new columns do not exist. */
export async function createPendingScan(
  url: string,
  strategy = "mobile"
): Promise<ScanRow> {
  const baseInsert = {
    url,
    strategy,
    score_performance: null,
    score_accessibility: null,
    score_best_practices: null,
    score_seo: null,
    raw_categories: null,
  };

  try {
    // Try with full new schema
    const fullInsert = {
      ...baseInsert,
      status: "pending",
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await table().insert(fullInsert).select().single();
    if (!error && data) return data as ScanRow;
  } catch {
    // Column missing fallback below
  }

  // Fallback to minimal schema if migration is not yet applied
  const { data, error } = await table().insert(baseInsert).select().single();
  if (error) throw new Error(`Failed to create scan: ${error.message}`);
  return {
    ...(data as ScanRow),
    status: "pending",
  };
}

/** Update an existing scan row. Degrades gracefully if new columns are missing in Supabase. */
export async function updateScan(
  id: string,
  updates: Partial<ScanRow>
): Promise<ScanRow | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, created_at: __, ...safeUpdates } = updates;
    const { data, error } = await table()
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) return data as ScanRow;

    // If update failed (possibly due to column missing), attempt stripped update
    if (error && error.message?.includes("column")) {
      const strippedUpdates: Record<string, unknown> = {};
      if (safeUpdates.score_performance !== undefined) strippedUpdates.score_performance = safeUpdates.score_performance;
      if (safeUpdates.score_accessibility !== undefined) strippedUpdates.score_accessibility = safeUpdates.score_accessibility;
      if (safeUpdates.score_best_practices !== undefined) strippedUpdates.score_best_practices = safeUpdates.score_best_practices;
      if (safeUpdates.score_seo !== undefined) strippedUpdates.score_seo = safeUpdates.score_seo;
      
      // Store additional pipeline fields in raw_categories
      const existingScan = await getScanById(id);
      const existingRaw = (existingScan?.raw_categories || {}) as Record<string, unknown>;
      strippedUpdates.raw_categories = {
        ...existingRaw,
        ...(safeUpdates.raw_categories || {}),
        _status: safeUpdates.status,
        _quick_checks: safeUpdates.quick_checks,
        _summary: safeUpdates.summary,
        _error_text: safeUpdates.error_text,
        _timings: safeUpdates.timings,
      };

      const { data: fallbackData } = await table()
        .update(strippedUpdates)
        .eq("id", id)
        .select()
        .single();

      if (fallbackData) {
        return {
          ...fallbackData,
          status: safeUpdates.status || fallbackData.status,
          quick_checks: safeUpdates.quick_checks || fallbackData.quick_checks,
          summary: safeUpdates.summary || fallbackData.summary,
        } as ScanRow;
      }
    }
  } catch (error) {
    console.error(`Failed to update scan ${id}:`, error);
  }

  return getScanById(id);
}

/** Save a completed PageSpeed audit to Supabase (synchronous legacy path). Returns the new row. */
export async function saveScan(scan: ScanInsert): Promise<ScanRow> {
  const { data, error } = await table().insert(scan).select().single();
  if (error) throw new Error(`Failed to save scan: ${error.message}`);
  return data as ScanRow;
}

/** Fetch the most recent N scans. */
export async function listScans(limit = 50): Promise<ScanRow[]> {
  const { data, error } = await table()
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to fetch scans: ${error.message}`);
  return (data ?? []) as ScanRow[];
}

/** Fetch a single scan by ID. */
export async function getScanById(id: string): Promise<ScanRow | null> {
  try {
    const { data, error } = await table().select("*").eq("id", id).single();
    if (error || !data) return null;
    
    // Check if fields are stored inside raw_categories fallback
    const row = data as ScanRow;
    const raw = row.raw_categories as Record<string, unknown> | null;
    if (raw) {
      if (!row.status && raw._status) row.status = raw._status as any;
      if (!row.quick_checks && raw._quick_checks) row.quick_checks = raw._quick_checks as any;
      if (!row.summary && raw._summary) row.summary = raw._summary as any;
      if (!row.error_text && raw._error_text) row.error_text = raw._error_text as any;
      if (!row.timings && raw._timings) row.timings = raw._timings as any;
    }
    // Default status to 'done' if scores exist and status is undefined
    if (!row.status) {
      row.status = row.score_performance !== null ? "done" : "running";
    }

    return row;
  } catch (error) {
    console.error("Failed to restore scan", error);
    return null;
  }
}

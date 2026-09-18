// ─── Supabase browser client (singleton) ───────────────────────
// Uses only the NEXT_PUBLIC_ vars so this is safe to import in
// both Server and Client components.
import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      scans: {
        Row: {
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
        Insert: Omit<Database["public"]["Tables"]["scans"]["Row"], "id" | "created_at">;
      };
      chat_messages: {
        Row: {
          id: string;
          created_at: string;
          scan_id: string;
          role: "user" | "assistant";
          content: string;
        };
        Insert: Omit<Database["public"]["Tables"]["chat_messages"]["Row"], "id" | "created_at">;
      };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_VITALS_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.VITALS_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_VITALS_SUPABASE_ANON_KEY!;

// createClient is cheap — but we cache it anyway to avoid
// creating a new socket on every module import in dev HMR.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

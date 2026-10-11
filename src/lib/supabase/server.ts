import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_VITALS_SUPABASE_URL ||
  process.env.VITALS_SUPABASE_URL;

let _serverClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Server-side database writes require SUPABASE_SERVICE_ROLE_KEY to be configured in your environment variables."
    );
  }

  if (!supabaseUrl) {
    throw new Error(
      "Supabase URL is missing. Set NEXT_PUBLIC_VITALS_SUPABASE_URL in your environment variables."
    );
  }

  if (!_serverClient) {
    _serverClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return _serverClient;
}

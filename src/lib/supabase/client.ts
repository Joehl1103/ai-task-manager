import { createClient } from "@supabase/supabase-js";

/**
 * Module-level singleton so all persistence calls share one client instance.
 * The Supabase client maintains internal state (auth session, WebSocket
 * connections) — recreating it on every call would cause connection leaks.
 */
let _client: ReturnType<typeof createClient> | null = null;

/**
 * Browser-safe Supabase client using the public anon key.
 * Row Level Security on Supabase handles authorization — the anon key is safe
 * to expose in client bundles. Never use the service role key here.
 *
 * Returns null when the env vars are not configured (local Postgres dev mode).
 */
export function getSupabaseClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  _client = createClient(url, key);
  return _client;
}

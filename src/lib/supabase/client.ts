import { createClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase client using the public anon key.
 * Row Level Security on Supabase handles authorization — the anon key is safe
 * to expose in client bundles. Never use the service role key here.
 *
 * Returns null when the env vars are not configured (local Postgres dev mode).
 */
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

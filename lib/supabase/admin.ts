import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — server-side only (API routes). Bypasses RLS.
 * Never import from client components (docs/SECURITY.md).
 *
 * Falls back to the anon key when no service-role key is configured; the v1
 * permissive RLS policies make that sufficient for the demo phase.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase admin credentials are not configured.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

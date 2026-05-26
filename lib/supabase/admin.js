// Service-role Supabase client. NEVER import this from a client component
// or pass its results to one — the service role bypasses RLS entirely.
// Use only in Route Handlers / Server Actions that have already verified
// the caller is an admin.
import { createClient } from "@supabase/supabase-js";

let _admin;

export function getSupabaseAdmin() {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env."
    );
  }
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

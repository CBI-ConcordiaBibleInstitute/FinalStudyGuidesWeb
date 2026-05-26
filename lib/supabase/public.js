// Anonymous server client — no cookies, no user session. Use this for
// queries that return data anyone is allowed to see (RLS handles enforcement
// against the anon role). Safe to call from sitemap, generateStaticParams,
// generateMetadata, and any Server Component rendering public content.
import { createClient } from "@supabase/supabase-js";

let _client;

export function getSupabasePublic() {
  if (_client) return _client;
  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  return _client;
}

// Exchanges the one-time `?code` from a Supabase email link (password
// recovery, magic link, email-change confirm) for a real session cookie,
// then forwards the user to `?next`. Required because @supabase/ssr uses
// the PKCE flow — the browser client alone can't redeem the code.
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";

  if (code) {
    const sb = getSupabaseServer();
    await sb.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

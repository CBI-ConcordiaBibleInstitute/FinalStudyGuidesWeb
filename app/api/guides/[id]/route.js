// Gateway for study-guide PDFs. The storage bucket is private, so every
// request flows through here: we look up the episode, check that the caller
// has access (free | admin | owns it), and 302-redirect to a short-lived
// signed URL generated with the service-role client.
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const SIGNED_TTL_SECONDS = 60 * 60;

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const episodeId = params.id;
  if (!episodeId) return new NextResponse("Missing episode id", { status: 400 });

  const sessionClient = getSupabaseServer();
  const { data: { user } } = await sessionClient.auth.getUser();

  const admin = getSupabaseAdmin();
  const { data: ep, error } = await admin
    .from("episodes")
    .select("id, free, published, guide_file")
    .eq("id", episodeId)
    .maybeSingle();
  if (error) return new NextResponse(error.message, { status: 500 });
  if (!ep || !ep.published) return new NextResponse("Not found", { status: 404 });
  if (!ep.guide_file) return new NextResponse("No study guide for this episode", { status: 404 });

  let allowed = ep.free === true;

  if (!allowed && user) {
    const { data: profile } = await admin
      .from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "admin") allowed = true;

    if (!allowed) {
      const { data: owned } = await admin
        .from("user_downloads")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("episode_id", ep.id)
        .maybeSingle();
      if (owned) allowed = true;
    }
  }

  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  const { data: signed, error: signErr } = await admin
    .storage.from("study-guides")
    .createSignedUrl(ep.guide_file, SIGNED_TTL_SECONDS);
  if (signErr || !signed?.signedUrl) {
    return new NextResponse(signErr?.message ?? "Could not sign URL", { status: 500 });
  }

  // Log the download. user_id is null for anonymous free-preview downloads
  // so the dashboard count still reflects total reach.
  admin
    .from("download_events")
    .insert({ user_id: user?.id ?? null, episode_id: ep.id })
    .then(({ error: logErr }) => {
      if (logErr) console.warn("[guides] download_events insert failed:", logErr.message);
    });

  return NextResponse.redirect(signed.signedUrl, 302);
}

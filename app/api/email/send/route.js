// Server-side email dispatch. The client (lib/email.js → deliver()) POSTs
// a fully-rendered payload here, and we send it through Resend. If
// RESEND_API_KEY is not configured, we log the send and return ok=true so
// dev environments behave like the old console-only mode.
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { renderEmail } from "@/lib/email-html";
import { SITE } from "@/lib/catalog-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM =
  process.env.EMAIL_FROM ||
  `${SITE.name} <contact@concordiastudyguides.com>`;

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { to, subject, body, preview, ctaUrl, ctaLabel, replyTo } = payload || {};
  if (!to || !subject || !body) {
    return NextResponse.json(
      { ok: false, error: "Missing to/subject/body" },
      { status: 400 }
    );
  }

  const html = renderEmail({ subject, preview, body, ctaUrl, ctaLabel });
  const text = body;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Dev fallback: act like the old deliver(). The Admin · Email page still
    // works because the client logs the payload locally before calling here.
    // eslint-disable-next-line no-console
    console.info("[email:dev] →", to, "·", subject, "(set RESEND_API_KEY to send)");
    return NextResponse.json({ ok: true, dev: true });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo: replyTo || SITE.email,
    });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Send failed" },
      { status: 502 }
    );
  }
}

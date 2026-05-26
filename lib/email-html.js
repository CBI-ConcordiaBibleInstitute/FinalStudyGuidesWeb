// Branded HTML wrapper for every transactional email Concordia sends.
// Inline CSS only — most email clients strip <style> blocks. Use email-safe
// units (px, %) and tables for layout where possible.

import { SITE } from "@/lib/catalog-shared";

const BRAND = {
  maroon: "#7a1c2f",
  gold: "#c8a24b",
  cream: "#f6efe3",
  ink: "#2b2622",
  inkSoft: "#6b6058",
  white: "#ffffff",
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://concordiastudyguides.com";

function abs(path) {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Convert the plain-text body produced by lib/email.js templates into HTML.
// Recognises: leading "  • " bullets, blank lines as paragraph breaks, naked
// /path links → absolute anchor tags.
function plainToHtml(text) {
  const paragraphs = String(text || "").split(/\n{2,}/);
  return paragraphs
    .map((para) => {
      const lines = para.split("\n");
      const bullets = lines.every((l) => /^\s*•\s+/.test(l) || !l.trim());
      if (bullets) {
        const items = lines
          .filter((l) => l.trim())
          .map((l) => `<li style="margin:6px 0">${linkify(l.replace(/^\s*•\s+/, ""))}</li>`)
          .join("");
        return `<ul style="margin:0 0 16px 20px;padding:0;color:${BRAND.ink};font-size:15px;line-height:1.6">${items}</ul>`;
      }
      return `<p style="margin:0 0 16px 0;color:${BRAND.ink};font-size:15px;line-height:1.65">${lines.map(linkify).join("<br>")}</p>`;
    })
    .join("");
}

function linkify(line) {
  const escaped = escapeHtml(line);
  return escaped.replace(/(\/[A-Za-z0-9/_\-?=&%.]+)/g, (match) => {
    if (match.startsWith("//")) return match;
    const href = abs(match);
    return `<a href="${href}" style="color:${BRAND.maroon};text-decoration:underline">${match}</a>`;
  });
}

export function renderEmail({ subject, preview, body, ctaUrl, ctaLabel }) {
  const safePreview = escapeHtml(preview || "");
  const contentHtml = plainToHtml(body);
  const cta = ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px"><tr><td bgcolor="${BRAND.maroon}" style="border-radius:8px"><a href="${abs(ctaUrl)}" style="display:inline-block;padding:12px 22px;color:${BRAND.white};font-weight:600;font-size:15px;text-decoration:none;font-family:Georgia,serif">${escapeHtml(ctaLabel || "Open Concordia")}</a></td></tr></table>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject || SITE.name)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all">${safePreview}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cream};padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${BRAND.white};border-radius:14px;overflow:hidden;border:1px solid rgba(122,28,47,0.10)">
        <tr><td style="background:${BRAND.maroon};padding:22px 32px" align="left">
          <a href="${SITE_URL}" style="text-decoration:none;color:${BRAND.white};font-family:Georgia,serif;font-size:20px;font-weight:700;letter-spacing:0.3px">${escapeHtml(SITE.name)}</a>
          <div style="color:${BRAND.gold};font-size:12px;letter-spacing:1.2px;text-transform:uppercase;margin-top:4px;font-weight:600">${escapeHtml(SITE.podcast)}</div>
        </td></tr>
        <tr><td style="padding:32px 32px 12px 32px">
          <h1 style="margin:0 0 18px 0;color:${BRAND.ink};font-family:Georgia,serif;font-size:24px;line-height:1.3;font-weight:700">${escapeHtml(subject || "")}</h1>
          ${contentHtml}
          ${cta}
        </td></tr>
        <tr><td style="padding:8px 32px 28px 32px">
          <hr style="border:0;border-top:1px solid rgba(122,28,47,0.12);margin:18px 0">
          <p style="margin:0;color:${BRAND.inkSoft};font-size:12px;line-height:1.6">
            You're receiving this because you have an account at <a href="${SITE_URL}" style="color:${BRAND.maroon};text-decoration:underline">${escapeHtml(SITE.name)}</a>.<br>
            Manage email preferences in your <a href="${abs("/dashboard")}" style="color:${BRAND.maroon};text-decoration:underline">dashboard</a> · Questions? <a href="mailto:${SITE.email}" style="color:${BRAND.maroon};text-decoration:underline">${SITE.email}</a>
          </p>
        </td></tr>
      </table>
      <p style="margin:14px 0 0;color:${BRAND.inkSoft};font-size:11px;font-style:italic">${escapeHtml(SITE.tagline)}</p>
    </td></tr>
  </table>
</body>
</html>`;
}

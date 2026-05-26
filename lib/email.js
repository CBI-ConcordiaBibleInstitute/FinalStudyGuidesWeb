// Email notification service for Concordia Bible Institute.
//
// Demo-friendly: in the browser there is no real SMTP; every send is logged
// to the console and pushed to a localStorage queue (`cb_email_log`) so the
// Admin · Email page can inspect what was dispatched. Wire `deliver()` to
// Resend / Postmark / SES later and every call site stays the same.
//
// Notification categories are exhaustive — covering every transactional and
// lifecycle email a professional SaaS / commerce / content platform sends.

import { SITE } from "@/lib/catalog-shared";

const QUEUE_KEY = "cb_email_log";
const MAX_LOG = 200;

// Categories a user can toggle individually in /dashboard. Every template
// declares which category it belongs to so we can respect preferences.
export const NOTIFICATION_CATEGORIES = {
  account: "Account & security",
  purchases: "Purchases & receipts",
  newEpisodes: "New episode alerts",
  digest: "Weekly digest",
  reminders: "Reminders & saved studies",
  announcements: "Announcements & promotions",
  product: "Product updates",
};

// Account & security emails are always sent — they are required for the
// service to function (verification, receipts, password resets, etc.).
const ALWAYS_ON = new Set(["account", "purchases"]);

// Default subscriptions for any new user.
export const DEFAULT_PREFERENCES = {
  account: true,
  purchases: true,
  newEpisodes: true,
  digest: true,
  reminders: true,
  announcements: true,
  product: true,
};

// Complete catalog of templates. Keep keys stable — they are referenced
// from sendEmail({ template: '...' }).
export const TEMPLATES = {
  // ──────────────── Account & security ────────────────
  welcome: {
    category: "account",
    label: "Welcome",
    subject: (d) => `Welcome to ${SITE.name}, ${firstName(d.name)}`,
    preview: "Your library is ready — the first episode of every series is on us.",
    body: (d) =>
      lines(
        `Grace and peace, ${firstName(d.name)}.`,
        ``,
        `Welcome to ${SITE.name} — home of the ${SITE.podcast} podcast and its companion study guides. We're glad you're here.`,
        ``,
        `Here's how to get the most from your account:`,
        ``,
        `  • Start with a free preview — every series opens with a free episode and full PDF guide.`,
        `  • Save what speaks to you — bookmark studies to pick up later from your dashboard.`,
        `  • Tell us what to send — choose which new-episode alerts you want from /dashboard.`,
        ``,
        `Open your library: /dashboard`,
        ``,
        `If you have questions, just reply to this email — it goes straight to our team.`,
        ``,
        `In Christ,`,
        `The ${SITE.short} team`
      ),
  },
  emailVerification: {
    category: "account",
    label: "Verify your email",
    subject: () => `Verify your email for ${SITE.name}`,
    preview: "Confirm your email address to unlock free previews.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Please confirm this email address belongs to you so we can keep your library and receipts secure.`,
        ``,
        `Verification link: ${d.verifyUrl || "/verify?token=…"}`,
        ``,
        `This link expires in 24 hours. If you did not create an account, you can ignore this email.`
      ),
  },
  emailVerified: {
    category: "account",
    label: "Email verified",
    subject: () => `Your ${SITE.short} email is verified`,
    preview: "Your inbox is set — receipts and new-episode alerts are on the way.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Your email address has been verified. You're all set to receive receipts, new-episode alerts, and the weekly digest.`,
        ``,
        `You can manage which emails you receive at any time from your dashboard.`
      ),
  },
  passwordResetRequested: {
    category: "account",
    label: "Reset your password",
    subject: () => `Reset your ${SITE.short} password`,
    preview: "Use this link within the next hour to choose a new password.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `We received a request to reset your password. Use the link below within the next hour to choose a new one:`,
        ``,
        `${d.resetUrl || "/reset?token=…"}`,
        ``,
        `If you didn't request this, you can safely ignore this email — your password will stay the same.`
      ),
  },
  passwordChanged: {
    category: "account",
    label: "Password changed",
    subject: () => `Your ${SITE.short} password was changed`,
    preview: "If this wasn't you, contact us immediately.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Your password was changed on ${fmtDate(d.at)}. If this wasn't you, please reply to this email or contact ${SITE.email} immediately so we can secure your account.`
      ),
  },
  loginAlert: {
    category: "account",
    label: "New sign-in detected",
    subject: () => `New sign-in to your ${SITE.short} account`,
    preview: "Review this sign-in if you don't recognise it.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `We detected a sign-in to your ${SITE.short} account.`,
        ``,
        `When: ${fmtDate(d.at)}`,
        `Device: ${d.device || "Unknown"}`,
        `Location: ${d.location || "Unknown"}`,
        ``,
        `If this was you, no action is needed. If not, change your password right away.`
      ),
  },
  profileUpdated: {
    category: "account",
    label: "Profile updated",
    subject: () => `Your ${SITE.short} profile was updated`,
    preview: "We saved your latest profile changes.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Your profile details were updated on ${fmtDate(d.at)}. If you didn't make this change, please contact ${SITE.email}.`
      ),
  },
  accountSuspended: {
    category: "account",
    label: "Account suspended",
    subject: () => `Your ${SITE.short} account has been suspended`,
    preview: "Reach out to support to restore access.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Your account has been temporarily suspended. You will not be able to sign in until access is restored.`,
        ``,
        `If you believe this is in error, reply to this email or contact ${SITE.email}.`
      ),
  },
  accountReinstated: {
    category: "account",
    label: "Account reinstated",
    subject: () => `Welcome back — your ${SITE.short} account is active`,
    preview: "Your library and saved studies are ready when you are.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Good news — your ${SITE.short} account has been reinstated. You can sign in and continue your study any time.`
      ),
  },
  accountDeleted: {
    category: "account",
    label: "Account deleted",
    subject: () => `Your ${SITE.short} account has been closed`,
    preview: "Thank you for studying with us.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Per your request, your account has been closed and your personal data has been removed. We're sorry to see you go and pray your study continues to bear fruit.`
      ),
  },

  // ──────────────── Commerce ────────────────
  orderConfirmation: {
    category: "purchases",
    label: "Order confirmation",
    subject: (d) => `Order #${d.orderId || "—"} confirmed`,
    preview: "Thanks for your purchase — your guides are unlocking now.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Thanks for your order. We've received your payment and your study guides are unlocking in your library.`,
        ``,
        `Order: #${d.orderId || "—"}`,
        `Items:`,
        ...(d.items || []).map((i) => `  • ${i.title} — $${(i.price || 99).toFixed(2)}`),
        `Total: $${(d.total || 0).toFixed(2)}`
      ),
  },
  purchaseReceipt: {
    category: "purchases",
    label: "Purchase receipt",
    subject: (d) => `Your receipt from ${SITE.short}`,
    preview: "Keep this for your records.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Your receipt for order #${d.orderId || "—"} on ${fmtDate(d.at)}.`,
        ``,
        ...(d.items || []).map((i) => `  • ${i.title} — $${(i.price || 99).toFixed(2)}`),
        ``,
        `Subtotal: $${(d.total || 0).toFixed(2)}`,
        `Tax: $0.00`,
        `Total charged: $${(d.total || 0).toFixed(2)}`,
        ``,
        `Need an invoice for accounting? Reply to this email and we'll send one.`
      ),
  },
  paymentFailed: {
    category: "purchases",
    label: "Payment failed",
    subject: () => `We couldn't process your payment`,
    preview: "Your order is on hold — update your card to complete it.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Your payment for order #${d.orderId || "—"} could not be processed. Your items are still in your cart — update your card and try again to complete the purchase.`,
        ``,
        `If you continue to see this, please contact ${SITE.email}.`
      ),
  },
  refundProcessed: {
    category: "purchases",
    label: "Refund processed",
    subject: (d) => `Refund issued for order #${d.orderId || "—"}`,
    preview: "Your refund is on its way.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `We've issued a refund of $${(d.amount || 0).toFixed(2)} for order #${d.orderId || "—"}. It should appear on your statement within 5–10 business days.`
      ),
  },
  cartAbandonment: {
    category: "reminders",
    label: "Items left in your cart",
    subject: () => `Your study guides are waiting`,
    preview: "Pick up where you left off.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `You left ${d.itemCount || "a few"} guide${d.itemCount === 1 ? "" : "s"} in your cart. Whenever you're ready, finish checkout to unlock the full studies and videos.`,
        ``,
        ...(d.items || []).map((i) => `  • ${i.title}`),
        ``,
        `Continue: /cart`
      ),
  },
  subscriptionRenewal: {
    category: "purchases",
    label: "Subscription renewal",
    subject: () => `Your ${SITE.short} subscription renews soon`,
    preview: "Heads-up before we charge your card.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Your subscription will renew on ${fmtDate(d.renewsAt)}. We'll charge $${(d.amount || 0).toFixed(2)} to the card on file.`,
        ``,
        `Manage your plan any time from your dashboard.`
      ),
  },

  // ──────────────── Content & engagement ────────────────
  newEpisode: {
    category: "newEpisodes",
    label: "New episode alert",
    subject: (d) => `New episode — ${d.episodeTitle || "fresh study guide"}`,
    preview: "A new study is live.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `A new episode just dropped on ${SITE.short}:`,
        ``,
        `📖 ${d.episodeTitle || "—"}`,
        `From the series: ${d.podcastName || "—"}`,
        ``,
        `Listen, read the guide, and add notes: /episodes/${d.episodeId || ""}`
      ),
  },
  newPodcastSeries: {
    category: "newEpisodes",
    label: "New podcast series launch",
    subject: (d) => `Launching: ${d.podcastName || "a new series"}`,
    preview: "A brand-new series is now in the library.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `We just launched a new series: ${d.podcastName || "—"}. The first episode is a free preview — start when you're ready.`
      ),
  },
  weeklyDigest: {
    category: "digest",
    label: "Weekly digest",
    subject: () => `This week on ${SITE.short}`,
    preview: "New episodes, popular studies, and what your fellow readers are bookmarking.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Here's what's new this week:`,
        ``,
        ...((d.items || []).map((i) => `  • ${i.title}`) || ["  • (your digest items)"]),
        ``,
        `Come back to your library: /dashboard`
      ),
  },
  bookmarkReminder: {
    category: "reminders",
    label: "Saved-study reminder",
    subject: () => `Pick up where you left off`,
    preview: "Studies you saved but haven't opened yet.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `You saved a few studies but haven't opened them yet. Here are some to dive back into:`,
        ``,
        ...((d.items || []).map((i) => `  • ${i.title}`) || [])
      ),
  },
  guideReady: {
    category: "purchases",
    label: "Your study guide is ready",
    subject: (d) => `Your guide is ready — ${d.episodeTitle || ""}`,
    preview: "Open it any time from your library.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `Your study guide for "${d.episodeTitle || "—"}" is unlocked and ready in your library. Read, mark, learn, and inwardly digest.`,
        ``,
        `Open: /episodes/${d.episodeId || ""}`
      ),
  },

  // ──────────────── Marketing / lifecycle ────────────────
  newsletterConfirm: {
    category: "announcements",
    label: "Confirm newsletter subscription",
    subject: () => `Confirm your subscription`,
    preview: "One quick click to start receiving new-episode alerts.",
    body: (d) =>
      lines(
        `Welcome!`,
        ``,
        `Please confirm your subscription to ${SITE.short}'s newsletter:`,
        ``,
        `${d.confirmUrl || "/confirm?token=…"}`,
        ``,
        `If you didn't subscribe, you can safely ignore this email.`
      ),
  },
  newsletterWelcome: {
    category: "announcements",
    label: "Newsletter welcome",
    subject: () => `You're on the list — ${SITE.short}`,
    preview: "Welcome — here's what to expect.",
    body: (d) =>
      lines(
        `Welcome!`,
        ``,
        `You're subscribed to ${SITE.short}'s newsletter. We send a short note whenever a new study guide is published — no noise, just Scripture.`
      ),
  },
  reEngagement: {
    category: "announcements",
    label: "We miss you",
    subject: () => `We saved your spot on ${SITE.short}`,
    preview: "Pick up your study any time.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `It's been a while. Your library is exactly where you left it — open any guide and pick up your study any time.`
      ),
  },
  promotional: {
    category: "announcements",
    label: "Promotion / announcement",
    subject: (d) => d.subject || `News from ${SITE.short}`,
    preview: "An update for our readers.",
    body: (d) => d.body || `Hi ${firstName(d.name)}, ${d.message || ""}`,
  },
  surveyRequest: {
    category: "announcements",
    label: "Feedback survey",
    subject: () => `Two minutes to make ${SITE.short} better?`,
    preview: "Your feedback shapes our next series.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `We'd love to hear what you think about the studies you've used. The survey is short — under two minutes.`,
        ``,
        `${d.surveyUrl || "/survey"}`
      ),
  },

  // ──────────────── Product / system ────────────────
  productUpdate: {
    category: "product",
    label: "Product update",
    subject: () => `What's new on ${SITE.short}`,
    preview: "Recent improvements to your study experience.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `We rolled out some changes you might enjoy:`,
        ``,
        ...((d.items || []).map((i) => `  • ${i}`) || [])
      ),
  },
  maintenanceNotice: {
    category: "product",
    label: "Scheduled maintenance",
    subject: () => `Brief scheduled maintenance`,
    preview: "Heads-up about a short window of downtime.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `We'll be doing brief maintenance on ${fmtDate(d.at)} (about ${d.duration || "30 minutes"}). Your library will be temporarily unavailable during that window.`
      ),
  },
  policyUpdate: {
    category: "product",
    label: "Terms / privacy update",
    subject: () => `Updates to our Terms and Privacy Policy`,
    preview: "A summary of what changed.",
    body: (d) =>
      lines(
        `Hi ${firstName(d.name)},`,
        ``,
        `We've updated our Terms of Service and Privacy Policy. The changes take effect on ${fmtDate(d.effectiveAt)}. Read the full text any time at /terms and /privacy.`
      ),
  },

  // ──────────────── Admin / staff internal ────────────────
  adminNewSignup: {
    category: "product",
    internal: true,
    label: "Admin · new sign-up",
    subject: (d) => `New sign-up: ${d.email || "—"}`,
    preview: "A new member just joined.",
    body: (d) =>
      lines(
        `New sign-up on ${SITE.short}:`,
        ``,
        `Name: ${d.userName || "—"}`,
        `Email: ${d.email || "—"}`,
        `Joined: ${fmtDate(d.at)}`
      ),
  },
  adminNewSale: {
    category: "product",
    internal: true,
    label: "Admin · new sale",
    subject: (d) => `Sale: $${(d.total || 0).toFixed(2)}`,
    preview: "A purchase just completed.",
    body: (d) =>
      lines(
        `New sale on ${SITE.short}:`,
        ``,
        `Customer: ${d.email || "—"}`,
        `Total: $${(d.total || 0).toFixed(2)}`,
        `Items:`,
        ...(d.items || []).map((i) => `  • ${i.title}`)
      ),
  },
};

// ───────────────────────── helpers ─────────────────────────
function firstName(name) {
  if (!name) return "friend";
  return String(name).split(/\s+/)[0];
}
function fmtDate(at) {
  const d = at ? new Date(at) : new Date();
  if (Number.isNaN(d.getTime())) return String(at);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
function lines(...rows) {
  return rows.join("\n");
}

function getQueue() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveQueue(q) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_LOG)));
  } catch {
    /* storage full — ignore in demo */
  }
}

// Fire-and-forget POST to /api/email/send. The server route renders the
// branded HTML wrapper and dispatches via Resend (or no-ops if the API key
// is unset). Skipped for internal admin-only payloads when no admin inbox
// is configured.
function deliver(payload) {
  if (typeof console !== "undefined") {
    // eslint-disable-next-line no-console
    console.info("[email] →", payload.to, "·", payload.subject);
  }
  if (typeof fetch === "undefined") return;
  // Build CTA based on template — most emails have a natural primary action.
  const cta = ctaFor(payload);
  try {
    fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        preview: payload.preview,
        body: payload.body,
        ctaUrl: cta?.url,
        ctaLabel: cta?.label,
      }),
      keepalive: true,
    }).catch(() => { /* best-effort; failures stay in localStorage log */ });
  } catch {
    /* ignore — Admin · Email log still records the attempt */
  }
}

// Map a queued payload's template to a primary CTA the HTML wrapper renders
// as a button. Null means "no button — links inside the body are enough."
function ctaFor(payload) {
  switch (payload.template) {
    case "welcome":               return { url: "/dashboard", label: "Open your library" };
    case "emailVerification":     return { url: payload.body.match(/Verification link: (\S+)/)?.[1] || "/login", label: "Verify your email" };
    case "passwordResetRequested":return { url: payload.body.match(/^(\S+)$/m)?.[1] || "/login", label: "Reset password" };
    case "newEpisode":            return { url: "/podcasts", label: "Listen to the episode" };
    case "newPodcastSeries":      return { url: "/podcasts", label: "Explore the series" };
    case "weeklyDigest":          return { url: "/dashboard", label: "Open your library" };
    case "bookmarkReminder":      return { url: "/dashboard", label: "Resume your studies" };
    case "guideReady":            return { url: "/dashboard", label: "Open your guide" };
    case "orderConfirmation":     return { url: "/dashboard", label: "View your library" };
    case "purchaseReceipt":       return { url: "/dashboard", label: "View your library" };
    case "cartAbandonment":       return { url: "/cart", label: "Return to your cart" };
    case "newsletterConfirm":     return { url: payload.body.match(/^(\S+)$/m)?.[1] || "/", label: "Confirm subscription" };
    case "newsletterWelcome":     return { url: "/podcasts", label: "Browse the library" };
    case "reEngagement":          return { url: "/dashboard", label: "Pick up where you left off" };
    default: return null;
  }
}

// Returns true if a given category is enabled for a user's preference set.
// `account` and `purchases` are always-on (legally required transactional).
export function isEnabled(category, prefs) {
  if (ALWAYS_ON.has(category)) return true;
  if (!prefs) return DEFAULT_PREFERENCES[category] ?? true;
  return prefs[category] !== false;
}

// Primary send function. Pass user prefs to respect their toggles; omit
// to force the send (admin broadcasts, etc.). Returns the queued record.
export function sendEmail({ to, template, data = {}, prefs, force = false }) {
  const def = TEMPLATES[template];
  if (!def) {
    throw new Error(`Unknown email template: ${template}`);
  }
  const fullData = { ...data, name: data.name || data.userName || to };
  const category = def.category || "announcements";
  if (!force && !isEnabled(category, prefs)) {
    return { skipped: true, reason: "user-preference", template, to };
  }
  const payload = {
    id: `em_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    to,
    template,
    category,
    label: def.label,
    subject:
      typeof def.subject === "function" ? def.subject(fullData) : def.subject,
    preview: def.preview || "",
    body: typeof def.body === "function" ? def.body(fullData) : def.body,
    internal: !!def.internal,
    at: new Date().toISOString(),
  };
  deliver(payload);
  const queue = getQueue();
  queue.push(payload);
  saveQueue(queue);
  return { ok: true, payload };
}

// Convenience: get the recent send log (used by Admin · Email).
export function getEmailLog() {
  return getQueue().slice().reverse();
}
export function clearEmailLog() {
  saveQueue([]);
}

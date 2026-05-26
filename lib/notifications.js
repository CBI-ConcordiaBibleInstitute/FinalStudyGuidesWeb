// High-level event triggers for the notification system.
//
// Pages call these functions on user events; the helper dispatches every
// relevant email (to the user, to admins, etc.) through `sendEmail`. Keeping
// the dispatch logic here means call sites stay one-liners.

import { sendEmail } from "@/lib/email";
import { SITE } from "@/lib/catalog";

const ADMIN_INBOX = SITE.email || "team@concordiastudyguides.com";

// Helper: extract notification prefs from a user object, surviving older
// accounts that pre-date the preferences feature.
function prefsFor(user) {
  return user?.notifications || undefined;
}

// ─── Account lifecycle ─────────────────────────────────────────────
export function notifySignup(user) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "welcome",
    data: { name: user.name },
    prefs: prefsFor(user),
  });
  sendEmail({
    to: user.email,
    template: "emailVerification",
    data: { name: user.name, verifyUrl: "/verify?token=demo" },
    prefs: prefsFor(user),
  });
  sendEmail({
    to: ADMIN_INBOX,
    template: "adminNewSignup",
    data: { userName: user.name, email: user.email, at: user.joinedAt },
    force: true,
  });
}

export function notifyLogin(user, meta = {}) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "loginAlert",
    data: {
      name: user.name,
      at: new Date().toISOString(),
      device: meta.device || (typeof navigator !== "undefined" ? navigator.userAgent : "Unknown"),
      location: meta.location || "Unknown",
    },
    prefs: prefsFor(user),
  });
}

export function notifyEmailVerified(user) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "emailVerified",
    data: { name: user.name },
    prefs: prefsFor(user),
  });
}

export function notifyPasswordResetRequest(email, name) {
  sendEmail({
    to: email,
    template: "passwordResetRequested",
    data: { name, resetUrl: "/reset?token=demo" },
    force: true, // security-critical
  });
}

export function notifyPasswordChanged(user) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "passwordChanged",
    data: { name: user.name, at: new Date().toISOString() },
    force: true,
  });
}

export function notifyProfileUpdated(user) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "profileUpdated",
    data: { name: user.name, at: new Date().toISOString() },
    prefs: prefsFor(user),
  });
}

export function notifyAccountSuspended(user) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "accountSuspended",
    data: { name: user.name },
    force: true,
  });
}

export function notifyAccountReinstated(user) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "accountReinstated",
    data: { name: user.name },
    force: true,
  });
}

export function notifyAccountDeleted(user) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "accountDeleted",
    data: { name: user.name },
    force: true,
  });
}

// ─── Commerce ──────────────────────────────────────────────────────
export function notifyPurchase(user, items, total) {
  if (!user?.email) return;
  const orderId = `CB-${Date.now().toString().slice(-6)}`;
  const at = new Date().toISOString();
  sendEmail({
    to: user.email,
    template: "orderConfirmation",
    data: { name: user.name, orderId, items, total, at },
    prefs: prefsFor(user),
  });
  sendEmail({
    to: user.email,
    template: "purchaseReceipt",
    data: { name: user.name, orderId, items, total, at },
    prefs: prefsFor(user),
  });
  items.forEach((i) =>
    sendEmail({
      to: user.email,
      template: "guideReady",
      data: { name: user.name, episodeTitle: i.title, episodeId: i.episodeId },
      prefs: prefsFor(user),
    })
  );
  sendEmail({
    to: ADMIN_INBOX,
    template: "adminNewSale",
    data: { email: user.email, items, total },
    force: true,
  });
}

export function notifyPaymentFailed(user, orderId) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "paymentFailed",
    data: { name: user.name, orderId },
    force: true,
  });
}

export function notifyRefund(user, orderId, amount) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "refundProcessed",
    data: { name: user.name, orderId, amount },
    force: true,
  });
}

export function notifyCartAbandoned(user, items) {
  if (!user?.email || !items?.length) return;
  sendEmail({
    to: user.email,
    template: "cartAbandonment",
    data: { name: user.name, items, itemCount: items.length },
    prefs: prefsFor(user),
  });
}

// ─── Content / engagement ──────────────────────────────────────────
// Broadcasts. `subscribers` is an array of { email, name, notifications? }.
export function notifyNewEpisode(subscribers, episode) {
  subscribers.forEach((s) =>
    sendEmail({
      to: s.email,
      template: "newEpisode",
      data: {
        name: s.name,
        episodeTitle: episode.title,
        episodeId: episode.id,
        podcastName: episode.podcastName,
      },
      prefs: prefsFor(s),
    })
  );
}

export function notifyNewSeries(subscribers, podcast) {
  subscribers.forEach((s) =>
    sendEmail({
      to: s.email,
      template: "newPodcastSeries",
      data: { name: s.name, podcastName: podcast.name },
      prefs: prefsFor(s),
    })
  );
}

export function notifyWeeklyDigest(subscribers, items) {
  subscribers.forEach((s) =>
    sendEmail({
      to: s.email,
      template: "weeklyDigest",
      data: { name: s.name, items },
      prefs: prefsFor(s),
    })
  );
}

// Fired when a signed-in user downloads a study guide. Sends a "guide ready"
// confirmation (always-on transactional, like a purchase receipt) so the user
// has a record + deep link back to the guide.
export function notifyDownload(user, episode) {
  if (!user?.email || !episode) return;
  sendEmail({
    to: user.email,
    template: "guideReady",
    data: {
      name: user.name,
      episodeTitle: episode.title,
      episodeId: episode.id,
    },
    prefs: prefsFor(user),
  });
}

export function notifyBookmarkReminder(user, items) {
  if (!user?.email || !items?.length) return;
  sendEmail({
    to: user.email,
    template: "bookmarkReminder",
    data: { name: user.name, items },
    prefs: prefsFor(user),
  });
}

// ─── Newsletter (anonymous, not yet a member) ─────────────────────
export function notifyNewsletterSubscribe(email) {
  sendEmail({
    to: email,
    template: "newsletterConfirm",
    data: { confirmUrl: "/confirm?token=demo" },
    force: true,
  });
  sendEmail({
    to: email,
    template: "newsletterWelcome",
    data: {},
    force: true,
  });
}

// ─── Marketing / lifecycle ────────────────────────────────────────
export function notifyAnnouncement(subscribers, { subject, body, message }) {
  subscribers.forEach((s) =>
    sendEmail({
      to: s.email,
      template: "promotional",
      data: { name: s.name, subject, body, message },
      prefs: prefsFor(s),
    })
  );
}

export function notifySurveyRequest(subscribers, surveyUrl) {
  subscribers.forEach((s) =>
    sendEmail({
      to: s.email,
      template: "surveyRequest",
      data: { name: s.name, surveyUrl },
      prefs: prefsFor(s),
    })
  );
}

export function notifyReEngagement(user) {
  if (!user?.email) return;
  sendEmail({
    to: user.email,
    template: "reEngagement",
    data: { name: user.name },
    prefs: prefsFor(user),
  });
}

// ─── Product / system ─────────────────────────────────────────────
export function notifyProductUpdate(subscribers, items) {
  subscribers.forEach((s) =>
    sendEmail({
      to: s.email,
      template: "productUpdate",
      data: { name: s.name, items },
      prefs: prefsFor(s),
    })
  );
}

export function notifyMaintenance(subscribers, at, duration) {
  subscribers.forEach((s) =>
    sendEmail({
      to: s.email,
      template: "maintenanceNotice",
      data: { name: s.name, at, duration },
      prefs: prefsFor(s),
    })
  );
}

export function notifyPolicyUpdate(subscribers, effectiveAt) {
  subscribers.forEach((s) =>
    sendEmail({
      to: s.email,
      template: "policyUpdate",
      data: { name: s.name, effectiveAt },
      force: true, // legal notification
    })
  );
}

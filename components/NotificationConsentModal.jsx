"use client";
// First-time consent prompt for marketing/lifecycle email. Shown the first
// time a signed-in user takes an action that would trigger a non-transactional
// notification (download a guide, subscribe to the newsletter). The choice is
// saved to profiles.notifications_consent_at so we never prompt again — they
// manage individual toggles from /dashboard.
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X } from "lucide-react";

export default function NotificationConsentModal({
  open,
  trigger = "download",
  onAllow,
  onDecline,
  onClose,
}) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const copy = trigger === "newsletter"
    ? "You're subscribing to new-episode alerts. We'd also like to send you our weekly digest and the occasional series announcement — all easy to turn off later."
    : "Want us to email you when a new episode drops, send a weekly study digest, and remind you of guides you've saved? You can change this any time from your dashboard.";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 backdrop-blur-sm p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-title"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="card relative w-full max-w-md p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full p-1.5 text-ink/60 hover:bg-cream hover:text-ink"
            >
              <X size={16} />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon text-cream">
              <Bell size={22} />
            </div>
            <h2 id="consent-title" className="mt-4 font-serif text-2xl font-bold text-ink">
              Stay in the Word — by email?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {copy}
            </p>
            <p className="mt-3 text-xs text-ink/70">
              Receipts, security alerts, and downloads are always sent — that's
              how we keep your account safe.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
              <button
                onClick={onAllow}
                className="btn-primary flex-1 justify-center"
              >
                <Bell size={15} /> Yes, email me
              </button>
              <button
                onClick={onDecline}
                className="btn-ghost flex-1 justify-center"
              >
                <BellOff size={15} /> No thanks
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Check } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { notifyNewsletterSubscribe } from "@/lib/notifications";
import NotificationConsentModal from "@/components/NotificationConsentModal";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const { push } = useToast();
  const { user, recordNotificationConsent } = useAuth();

  const finalize = () => {
    try { notifyNewsletterSubscribe(email); } catch { /* best-effort */ }
    setDone(true);
    push("You're subscribed — watch for new-episode alerts.");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      push("Please enter a valid email address.", "error");
      return;
    }
    // Signed-in user who has never answered the consent prompt: show it
    // before we wire them up to lifecycle/announcement email.
    if (user && !user.notificationsConsentAt) {
      setConsentOpen(true);
      return;
    }
    finalize();
  };

  const onConsentAllow = async () => {
    setConsentOpen(false);
    await recordNotificationConsent(true);
    finalize();
  };
  const onConsentDecline = async () => {
    setConsentOpen(false);
    await recordNotificationConsent(false);
    // Still send the double-opt-in confirm — the user explicitly typed an
    // address into the newsletter form. They just won't get broader
    // announcements until they re-enable from /dashboard.
    finalize();
  };

  return (
    <>
    <NotificationConsentModal
      open={consentOpen}
      trigger="newsletter"
      onAllow={onConsentAllow}
      onDecline={onConsentDecline}
      onClose={() => setConsentOpen(false)}
    />
    <div className="overflow-hidden rounded-3xl bg-maroon-gradient p-8 text-cream sm:p-12">
      <div className="mx-auto max-w-xl text-center">
        <span className="eyebrow text-gold-light">Stay in the Word</span>
        <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
          New episodes, in your inbox
        </h2>
        <p className="mt-3 text-cream/75">
          A short note whenever a new study guide is published. No noise — just
          Scripture.
        </p>

        {done ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold"
          >
            <Check size={18} className="text-gold" /> You're on the list.
          </motion.div>
        ) : (
          <form
            onSubmit={submit}
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon/50"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="w-full rounded-full border-0 bg-white py-3 pl-11 pr-4 text-sm text-ink"
              />
            </div>
            <button type="submit" className="btn-gold whitespace-nowrap">
              Notify me
            </button>
          </form>
        )}
      </div>
    </div>
    </>
  );
}

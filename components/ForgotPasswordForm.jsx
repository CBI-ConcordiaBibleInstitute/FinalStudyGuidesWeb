"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, ShieldCheck, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await requestPasswordReset(email.trim());
    setLoading(false);
    // We always show the same success screen to avoid revealing whether
    // an account exists, but a true error from Supabase (e.g. invalid
    // email format, network) still surfaces.
    if (!res.ok) {
      setError(res.error);
      setShake((s) => s + 1);
      return;
    }
    setSent(true);
  };

  return (
    <div className="container-cb flex min-h-[80vh] items-center justify-center py-14">
      <motion.div
        key={shake}
        animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="card p-9">
          <div className="flex flex-col items-center text-center">
            <Logo size={52} />
            <h1 className="mt-4 font-serif text-4xl font-bold text-ink">
              {sent ? "Check your inbox" : "Reset your password"}
            </h1>
            <p className="mt-2 text-ink">
              {sent
                ? `If an account exists for ${email}, you'll receive an email with a link to choose a new password. The link is valid for one hour.`
                : "Enter the email on your account and we'll send you a link to set a new password."}
            </p>
          </div>

          {!sent && (
            <form onSubmit={submit} className="mt-7 space-y-3.5">
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-maroon/45"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="input pl-10"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
                >
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Send reset link"}
              </button>
            </form>
          )}

          {sent && (
            <div className="mt-7 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p>
                Didn't receive it? Check your spam folder, or{" "}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => { setSent(false); }}
                >
                  try again
                </button>
                .
              </p>
            </div>
          )}

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink">
            <ShieldCheck size={14} className="text-emerald-500" />
            Secured by Supabase Auth — links expire after one hour.
          </p>

          <p className="mt-4 text-center text-sm text-ink">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-maroon hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

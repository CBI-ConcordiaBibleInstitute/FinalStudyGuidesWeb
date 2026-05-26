"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

// Reached after the user clicks the "Reset password" email link. By the
// time we render, /auth/callback has already exchanged the one-time code
// for a session, so getSession() returns the recovery session.
export default function ResetPasswordForm() {
  const router = useRouter();
  const { logout } = useAuth();
  const { push } = useToast();

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setChecking(false);
    });
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setShake((s) => s + 1);
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      setShake((s) => s + 1);
      return;
    }
    setLoading(true);
    const sb = getSupabaseBrowser();
    const { error: updateErr } = await sb.auth.updateUser({ password: form.password });
    if (updateErr) {
      setLoading(false);
      setError(updateErr.message);
      setShake((s) => s + 1);
      return;
    }
    // Fire the "your password was changed" notification (best-effort).
    try {
      const { notifyPasswordChanged } = await import("@/lib/notifications");
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        notifyPasswordChanged({ email: user.email, name: user.user_metadata?.name });
      }
    } catch {}
    // Force a clean re-login with the new password.
    await logout();
    setLoading(false);
    push("Password updated. Log in with your new password.");
    router.push("/login");
  };

  if (checking) {
    return (
      <div className="container-cb flex min-h-[80vh] items-center justify-center py-14">
        <Loader2 size={28} className="animate-spin text-maroon" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="container-cb flex min-h-[80vh] items-center justify-center py-14">
        <div className="w-full max-w-md">
          <div className="card p-9 text-center">
            <Logo size={52} />
            <h1 className="mt-4 font-serif text-3xl font-bold text-ink">
              Link expired or invalid
            </h1>
            <p className="mt-2 text-ink">
              This reset link can no longer be used. Request a fresh one and we'll send another email.
            </p>
            <Link href="/forgot-password" className="btn-primary mt-6 inline-flex">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              Choose a new password
            </h1>
            <p className="mt-2 text-ink">
              Pick something you don't use elsewhere — at least 6 characters.
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-3.5">
            <Field
              icon={Lock}
              type="password"
              placeholder="New password"
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
            />
            <Field
              icon={Lock}
              type="password"
              placeholder="Confirm new password"
              value={form.confirm}
              onChange={set("confirm")}
              autoComplete="new-password"
            />

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
              >
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Update password"}
            </button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink">
            <ShieldCheck size={14} className="text-emerald-500" />
            We'll sign you out after this so you can log in with the new password.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon
        size={17}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-maroon/45"
      />
      <input {...props} required className="input pl-10" />
    </div>
  );
}

"use client";
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, Mail, Lock, User, ShieldCheck,
  Eye, EyeOff, RefreshCw, Check, X,
} from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

// ── password helpers ──────────────────────────────────────────────────────────
const UPPER   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER   = "abcdefghijklmnopqrstuvwxyz";
const DIGITS  = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";

function generateStrongPassword() {
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS),
                 ...Array.from({ length: 12 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const REQUIREMENTS = [
  { key: "len",   label: "At least 8 characters",  test: (p) => p.length >= 8 },
  { key: "upper", label: "One uppercase letter",    test: (p) => /[A-Z]/.test(p) },
  { key: "digit", label: "One number",              test: (p) => /[0-9]/.test(p) },
  { key: "sym",   label: "One special character",   test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function passwordScore(pwd) {
  let s = 0;
  if (pwd.length >= 8)  s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

const STRENGTH = [
  null,
  { label: "Weak",   bar: "w-1/4",  color: "bg-red-500",     text: "text-red-600"     },
  { label: "Fair",   bar: "w-2/4",  color: "bg-orange-400",  text: "text-orange-500"  },
  { label: "Good",   bar: "w-3/4",  color: "bg-yellow-400",  text: "text-yellow-600"  },
  { label: "Strong", bar: "w-full", color: "bg-emerald-500", text: "text-emerald-600" },
  { label: "Strong", bar: "w-full", color: "bg-emerald-500", text: "text-emerald-600" },
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router   = useRouter();
  const params   = useSearchParams();
  const { signup, login } = useAuth();
  const { push } = useToast();

  const [form, setForm]   = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake]     = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setTouched((t) => ({ ...t, [k]: true }));
  };

  const suggestPassword = useCallback(() => {
    const pwd = generateStrongPassword();
    setForm((f) => ({ ...f, password: pwd, confirm: pwd }));
    setShowPwd(true);
    setShowConfirm(true);
    setTouched((t) => ({ ...t, password: true, confirm: true }));
  }, []);

  // derived validation
  const emailInvalid  = touched.email    && form.email    && !isValidEmail(form.email);
  const score         = passwordScore(form.password);
  const strength      = STRENGTH[Math.min(score, 5)];
  const confirmMismatch = touched.confirm && form.confirm && form.confirm !== form.password;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignup) {
      if (!isValidEmail(form.email))
        return (setError("Please enter a valid email address."), setShake((s) => s + 1));
      if (score < 2)
        return (setError("Your password is too weak — aim for at least 'Fair'."), setShake((s) => s + 1));
      if (form.password !== form.confirm)
        return (setError("Passwords don't match."), setShake((s) => s + 1));
    }

    setLoading(true);
    const res = isSignup ? await signup(form) : await login(form);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      setShake((s) => s + 1);
      return;
    }
    push(
      isSignup
        ? "Welcome to Concordia! Check your inbox to verify your email."
        : "Welcome back."
    );
    router.push(params.get("next") || "/dashboard");
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
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-ink">
              {isSignup
                ? "Start free — the first episode of every series is on us."
                : "Log in to continue your study."}
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-3.5">
            {/* Name (signup only) */}
            {isSignup && (
              <div className="relative">
                <User size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-maroon/45" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={set("name")}
                  autoComplete="name"
                  required
                  className="input pl-10"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <div className="relative">
                <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-maroon/45" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                  required
                  className={`input pl-10 ${emailInvalid ? "border-red-400 focus:border-red-500" : ""}`}
                />
              </div>
              {emailInvalid && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <X size={12} /> Please enter a valid email address.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="relative">
                <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-maroon/45" />
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  className="input pl-10 pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isSignup && (
                    <button
                      type="button"
                      onClick={suggestPassword}
                      title="Suggest a strong password"
                      className="rounded p-1.5 text-maroon/50 hover:bg-maroon/8 hover:text-maroon transition"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    title={showPwd ? "Hide password" : "Show password"}
                    className="rounded p-1.5 text-maroon/50 hover:bg-maroon/8 hover:text-maroon transition"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Strength bar (signup only) */}
              {isSignup && form.password && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-1.5 flex-1 rounded-full bg-rule overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength?.bar ?? "w-0"} ${strength?.color ?? ""}`}
                      />
                    </div>
                    {strength && (
                      <span className={`ml-3 text-xs font-semibold ${strength.text}`}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {REQUIREMENTS.map(({ key, label, test }) => {
                      const met = test(form.password);
                      return (
                        <li key={key} className={`flex items-center gap-1 text-xs ${met ? "text-emerald-600" : "text-ink/50"}`}>
                          {met ? <Check size={11} /> : <X size={11} />}
                          {label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm password (signup only) */}
            {isSignup && (
              <div className="space-y-1">
                <div className="relative">
                  <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-maroon/45" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm password"
                    value={form.confirm}
                    onChange={set("confirm")}
                    autoComplete="new-password"
                    required
                    className={`input pl-10 pr-10 ${confirmMismatch ? "border-red-400 focus:border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-maroon/50 hover:bg-maroon/8 hover:text-maroon transition"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmMismatch && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <X size={12} /> Passwords don&apos;t match.
                  </p>
                )}
                {touched.confirm && form.confirm && !confirmMismatch && (
                  <p className="flex items-center gap-1 text-xs text-emerald-600">
                    <Check size={12} /> Passwords match.
                  </p>
                )}
              </div>
            )}

            {/* Forgot password (login only) */}
            {!isSignup && (
              <div className="-mt-1 text-right">
                <Link href="/forgot-password" className="text-sm font-medium text-maroon hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isSignup ? (
                "Create account"
              ) : (
                "Log in"
              )}
            </button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink">
            <ShieldCheck size={14} className="text-emerald-500" />
            Secured by Supabase Auth — your password is never stored in plain text.
          </p>

          <p className="mt-4 text-center text-sm text-ink">
            {isSignup ? "Already have an account? " : "New to Concordia? "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-semibold text-maroon hover:underline"
            >
              {isSignup ? "Log in" : "Create one free"}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

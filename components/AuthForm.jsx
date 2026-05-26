"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const params = useSearchParams();
  const { signup, login } = useAuth();
  const { push } = useToast();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
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
            {isSignup && (
              <Field
                icon={User}
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
              />
            )}
            <Field
              icon={Mail}
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
            />
            <Field
              icon={Lock}
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={set("password")}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />

            {!isSignup && (
              <div className="-mt-1 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-maroon hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
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

"use client";
// Route-level error boundary — keeps the platform from white-screening.
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function Error({ error, reset }) {
  return (
    <div className="container-cb flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-maroon/10 text-maroon">
        <AlertTriangle size={36} />
      </div>
      <h1 className="mt-7 font-serif text-4xl font-bold text-ink sm:text-5xl">
        Something interrupted your study
      </h1>
      <p className="mt-3 max-w-md text-lg text-ink">
        An unexpected error occurred. Your account and library are safe — please
        try again.
      </p>
      {error?.digest && (
        <p className="mt-2 text-xs text-ink">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn-primary">
          <RotateCw size={16} /> Try again
        </button>
        <Link href="/" className="btn-ghost">
          Back to home
        </Link>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import { SITE, STATS } from "@/lib/catalog-shared";
import { useSettings } from "@/context/SettingsContext";

// Plain hero — concordiabible.org style. No orbs, no 3D, no gradient text.
export default function Hero() {
  const { price } = useSettings();
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-panel">
      {/* Soft glowing aurora behind the hero — purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,168,230,0.18),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-0 h-[300px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(102,14,27,0.18),transparent_70%)] blur-2xl"
      />
      <div className="container-cb relative py-12 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-maroon text-glow-soft">
            The {SITE.podcast} Podcast
          </p>

          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-maroon sm:text-5xl">
            Study every word of Scripture,{" "}
            <span className="text-gradient-cb">deeply</span>.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink sm:text-lg">
            {STATS.guides} guided studies across {STATS.podcasts} books of the
            Bible — paired with podcast episodes from {SITE.campus}. Read, mark,
            learn, and inwardly digest the sacred Scripture.
          </p>

          <div className="mx-auto mt-8 w-full max-w-2xl">
            <SearchBar big />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/podcasts" className="btn-primary">
              Explore podcasts <ArrowRight size={16} />
            </Link>
            <Link href="/pricing" className="btn-ghost">
              <PlayCircle size={16} /> See pricing — ${price}/episode
            </Link>
          </div>

          <p className="mt-6 text-sm text-ink">
            <span className="text-emerald-700">✓</span> First episode of every
            series is free — no card required.
          </p>
        </div>
      </div>
      <hr className="border-rule" />
    </section>
  );
}

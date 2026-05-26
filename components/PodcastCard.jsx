"use client";
// Flat series card with animated SaaS-style shine border on hover.
import Link from "next/link";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";

export default function PodcastCard({ podcast }) {
  return (
    <article className="shine-card group flex h-full flex-col overflow-hidden border border-rule bg-white shadow-card transition hover:shadow-lift">
      <Link
        href={`/podcasts/${podcast.slug}`}
        className="flex h-full flex-col no-underline hover:no-underline"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={podcast.image}
            alt={`${podcast.name} series cover`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute left-3 top-3">
            <span className="rounded-md bg-maroon/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
              {podcast.testament}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 text-left">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-xl font-bold leading-tight text-maroon">
              {podcast.name}
            </h3>
            <BookOpen size={18} className="mt-1 shrink-0 text-maroon" />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {podcast.theme}
          </p>
          <p className="mt-3 text-xs font-semibold text-ink">
            {podcast.episodeCount} episodes · {podcast.freeCount} free
          </p>
          {podcast.previewEpisodes?.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {podcast.previewEpisodes.slice(0, 2).map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-1.5 text-xs text-ink"
                >
                  <Sparkles size={11} className="mt-0.5 shrink-0 text-gold" />
                  <span className="line-clamp-1">{t}</span>
                </li>
              ))}
            </ul>
          )}
          <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-gold-dark transition group-hover:gap-2 group-hover:text-maroon">
            Open series <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </article>
  );
}

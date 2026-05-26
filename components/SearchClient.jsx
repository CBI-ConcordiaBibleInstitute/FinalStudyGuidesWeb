"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import EpisodeRow from "@/components/EpisodeRow";

export default function SearchClient() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [results, setResults] = useState({ episodes: [], podcasts: [] });

  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults({ episodes: [], podcasts: [] }); return; }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (r.ok) setResults(await r.json());
      } catch {}
    }, 150);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [q]);

  const hasQuery = q.trim().length > 0;
  const totalCount = results.episodes.length + results.podcasts.length;

  return (
    <div>
      <div className="relative mx-auto max-w-2xl">
        <Search
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-maroon/50"
        />
        <input
          type="search"
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by book, passage, or theme…"
          aria-label="Search the library"
          className="w-full rounded-full border border-maroon/15 bg-white py-4 pl-12 pr-5 text-base shadow-card focus:border-maroon"
        />
      </div>

      {!hasQuery && (
        <div className="mt-10 text-center text-ink">
          <p>Start typing to search the full library.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["Genesis", "Resurrection", "Psalm", "Justice", "Romans"].map(
              (term) => (
                <button
                  key={term}
                  onClick={() => setQ(term)}
                  className="rounded-full border border-maroon/20 px-3.5 py-1.5 text-sm text-maroon hover:bg-maroon/5"
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {hasQuery && (
        <p className="mt-8 text-sm font-medium text-ink">
          {totalCount} result{totalCount === 1 ? "" : "s"} for “{q.trim()}”
        </p>
      )}

      {hasQuery && results.podcasts.length > 0 && (
        <section className="mt-4">
          <h2 className="font-serif text-xl font-bold text-ink">Series</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {results.podcasts.map((p) => (
              <Link
                key={p.slug}
                href={`/podcasts/${p.slug}`}
                className="rounded-full border border-maroon/20 bg-white px-4 py-2 text-sm font-semibold text-maroon shadow-card hover:bg-maroon/5"
              >
                {p.name} · {p.episodeCount} episodes
              </Link>
            ))}
          </div>
        </section>
      )}

      {hasQuery && results.episodes.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-xl font-bold text-ink">
            Study guides
          </h2>
          <div className="mt-3 space-y-3">
            {results.episodes.map((e, i) => (
              <EpisodeRow
                key={e.id}
                episode={e}
                podcastName={e.podcastName}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      {hasQuery && totalCount === 0 && (
        <p className="mt-12 text-center text-ink">
          No study guides match “{q.trim()}”. Try a book name or a theme.
        </p>
      )}
    </div>
  );
}

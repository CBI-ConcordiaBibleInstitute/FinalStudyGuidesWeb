"use client";
// Search box with a live dropdown of matches. Used in the hero and on /search.
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, CornerDownLeft } from "lucide-react";

export default function SearchBar({ autoFocus = false, big = false }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ episodes: [], podcasts: [] });
  const boxRef = useRef(null);

  // Debounced fetch — runs after typing settles. Aborts on a newer keystroke
  // so out-of-order responses can't overwrite a fresher result set.
  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults({ episodes: [], podcasts: [] }); return; }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (r.ok) setResults(await r.json());
      } catch { /* aborted or network */ }
    }, 150);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [q]);

  const topEpisodes = results.episodes.slice(0, 5);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit}>
        <div className="relative">
          <Search
            size={big ? 22 : 18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-maroon/50"
          />
          <input
            type="search"
            value={q}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search 319 study guides — try “Genesis”, “resurrection”, “Psalm 23”…"
            aria-label="Search study guides and episodes"
            className={`w-full rounded-full border border-maroon/15 bg-white text-ink placeholder:text-ink shadow-card focus:border-maroon ${
              big ? "py-4 pl-12 pr-28 text-base" : "py-3 pl-11 pr-24 text-sm"
            }`}
          />
          <button
            type="submit"
            className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 !rounded-full px-5 py-2 text-xs"
          >
            Search
          </button>
        </div>
      </form>

      {open && q.trim() && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-maroon/10 bg-white shadow-lift">
          {topEpisodes.length === 0 && results.podcasts.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink">
              No study guides match “{q}”.
            </p>
          ) : (
            <ul className="max-h-[340px] overflow-y-auto scrollbar-thin py-1.5">
              {results.podcasts.slice(0, 3).map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/podcasts/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-cream"
                  >
                    <span className="text-sm font-semibold text-maroon">
                      {p.name}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-ink">
                      Series · {p.episodeCount} eps
                    </span>
                  </Link>
                </li>
              ))}
              {topEpisodes.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/episodes/${e.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream"
                  >
                    <span className="line-clamp-1 flex-1 text-sm text-ink">
                      {e.title}
                    </span>
                    {e.free && <span className="badge-free">Free</span>}
                  </Link>
                </li>
              ))}
              <li className="border-t border-maroon/10">
                <button
                  onClick={submit}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-maroon hover:bg-cream"
                >
                  <CornerDownLeft size={14} />
                  See all results for “{q}”
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PodcastCard from "@/components/PodcastCard";
import { TESTAMENTS } from "@/lib/catalog-shared";

export default function PodcastBrowser({ cards }) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      const okFilter = filter === "All" || c.testament === filter;
      const okQuery =
        !q || `${c.name} ${c.theme}`.toLowerCase().includes(q);
      return okFilter && okQuery;
    });
  }, [cards, filter, query]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TESTAMENTS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === t
                  ? "bg-maroon text-white shadow-card"
                  : "border border-maroon/20 text-maroon hover:bg-maroon/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter series…"
          aria-label="Filter series by name"
          className="input sm:max-w-xs"
        />
      </div>

      <p className="mt-6 text-sm text-ink">
        Showing {shown.length} of {cards.length} series
      </p>

      {shown.length === 0 ? (
        <p className="py-20 text-center text-ink">
          No series match your filters.
        </p>
      ) : (
        <motion.div
          layout
          className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {shown.map((p, i) => (
            <PodcastCard key={p.slug} podcast={p} index={i} />
          ))}
        </motion.div>
      )}
    </>
  );
}

"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Lock, Clock, FileText, Check, Plus } from "lucide-react";
import { useCart, GUIDE_PRICE } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function EpisodeRow({ episode, podcastName, index = 0 }) {
  const { has, add } = useCart();
  const { user } = useAuth();
  const { push } = useToast();

  const unlocked =
    episode.free || (user?.downloads?.includes(episode.id) ?? false);
  const inCart = has(episode.id);

  const onAdd = () => {
    add({
      episodeId: episode.id,
      title: episode.title,
      podcastSlug: episode.podcastSlug,
    });
    push(`Added “${episode.title}” to cart.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (index % 12) * 0.04 }}
      className="episode-shine group flex items-center gap-4 rounded-xl p-4 transition"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-serif text-lg font-bold ${
          unlocked
            ? "bg-gradient-to-br from-maroon to-maroon-dark text-white shadow-md"
            : "bg-gradient-to-br from-panel to-rule text-ink"
        }`}
      >
        {episode.number}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {episode.free ? (
            <span className="badge-free">Free</span>
          ) : !unlocked ? (
            <span className="badge-locked">
              <Lock size={10} /> ${GUIDE_PRICE}
            </span>
          ) : (
            <span className="badge-free">Unlocked</span>
          )}
          {podcastName && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink">
              {podcastName}
            </span>
          )}
        </div>
        <Link
          href={`/episodes/${episode.id}`}
          className="mt-1 block font-serif text-lg font-bold leading-snug text-ink no-underline transition hover:text-maroon hover:no-underline"
        >
          {episode.title}
        </Link>
        <p className="mt-0.5 line-clamp-1 text-sm text-ink">
          {episode.summary}
        </p>
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold text-ink lg:flex">
        <Clock size={13} />
        {episode.duration} min
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!unlocked &&
          (inCart ? (
            <span className="btn-ghost cursor-default px-3 py-2 text-xs">
              <Check size={14} /> In cart
            </span>
          ) : (
            <button onClick={onAdd} className="btn-ghost px-3 py-2 text-xs">
              <Plus size={14} /> Add
            </button>
          ))}
        <Link
          href={`/episodes/${episode.id}`}
          aria-label={`Open ${episode.title}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-maroon to-maroon-dark text-white shadow-md transition group-hover:scale-110 group-hover:shadow-lift"
        >
          {unlocked ? <Play size={16} /> : <FileText size={16} />}
        </Link>
      </div>
    </motion.div>
  );
}

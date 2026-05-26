import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EpisodeRow from "@/components/EpisodeRow";
import { getPodcast, getPodcasts } from "@/lib/catalog";

// Prebuild every series page when env is configured; otherwise let them
// render lazily on first request (e.g. local builds without .env.local).
export async function generateStaticParams() {
  try {
    const all = await getPodcasts();
    return all.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const p = await getPodcast(params.slug).catch(() => null);
  if (!p) return { title: "Series not found" };
  return {
    title: `${p.name} — Study Guide Series`,
    description: p.theme,
  };
}

export default async function PodcastDetailPage({ params }) {
  const podcast = await getPodcast(params.slug).catch(() => null);
  if (!podcast) notFound();

  return (
    <>
      <PageHeader
        eyebrow={`${podcast.testament} · Christ in Every Word`}
        title={podcast.name}
        subtitle={podcast.theme}
      />

      <div className="container-cb py-16 sm:py-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/podcasts"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline"
          >
            <ArrowLeft size={16} /> All series
          </Link>
          <div className="flex items-center gap-3 text-sm text-ink">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-maroon/15 bg-white px-3 py-1.5 shadow-card">
              <BookOpen size={15} /> {podcast.episodeCount} episodes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-maroon/15 bg-white px-3 py-1.5 shadow-card">
              <Lock size={15} /> {podcast.freeCount} free
            </span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {podcast.episodes.map((ep, i) => (
            <EpisodeRow key={ep.id} episode={ep} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}

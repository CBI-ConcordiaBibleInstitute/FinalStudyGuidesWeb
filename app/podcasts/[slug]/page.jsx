import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import EpisodeRow from "@/components/EpisodeRow";
import { getPodcast, getPodcasts, podcastImage } from "@/lib/catalog";

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

  const coverImage = podcastImage(podcast.slug);

  return (
    <>
      {/* Series header with cover art */}
      <section className="bg-white">
        <div className="container-cb py-10 sm:py-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
            {/* Cover image */}
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt={`${podcast.name} series cover`}
                width={160}
                height={160}
                className="h-36 w-36 rounded-2xl object-cover shadow-lift ring-1 ring-maroon/10 sm:h-40 sm:w-40"
              />
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-maroon">
                {podcast.testament} · Christ in Every Word
              </p>
              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-maroon sm:text-4xl">
                {podcast.name}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink sm:text-lg">
                {podcast.theme}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-maroon/15 bg-white px-3 py-1.5 shadow-card">
                  <BookOpen size={15} /> {podcast.episodeCount} episodes
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-maroon/15 bg-white px-3 py-1.5 shadow-card">
                  <Lock size={15} /> {podcast.freeCount} free
                </span>
              </div>
            </div>
          </div>
        </div>
        <hr className="border-rule" />
      </section>

      <div className="container-cb py-16 sm:py-20">
        <Link
          href="/podcasts"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline"
        >
          <ArrowLeft size={16} /> All series
        </Link>

        <div className="mt-8 space-y-4">
          {podcast.episodes.map((ep, i) => (
            <EpisodeRow key={ep.id} episode={ep} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}

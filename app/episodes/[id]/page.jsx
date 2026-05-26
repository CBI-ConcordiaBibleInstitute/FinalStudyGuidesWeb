import { notFound } from "next/navigation";
import EpisodeView from "@/components/EpisodeView";
import { getEpisode, getAllEpisodes } from "@/lib/catalog";

export async function generateStaticParams() {
  try {
    const all = await getAllEpisodes();
    return all.map((e) => ({ id: e.id }));
  } catch {
    return [];
  }
}

export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const ep = await getEpisode(params.id).catch(() => null);
  if (!ep) return { title: "Episode not found" };
  return {
    title: ep.title,
    description: ep.summary,
  };
}

export default async function EpisodePage({ params }) {
  const ep = await getEpisode(params.id).catch(() => null);
  if (!ep) notFound();

  const { podcast, ...episode } = ep;
  const related = podcast.episodes
    .filter((e) => e.id !== episode.id)
    .slice(0, 6);

  return <EpisodeView episode={episode} podcast={podcast} related={related} />;
}

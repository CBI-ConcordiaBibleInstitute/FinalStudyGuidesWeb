import PageHeader from "@/components/PageHeader";
import PodcastBrowser from "@/components/PodcastBrowser";
import { getPodcastCards } from "@/lib/catalog";
import { STATS } from "@/lib/catalog-shared";

export const metadata = {
  title: "All Podcasts & Study Guide Series",
  description:
    "Browse every book of the Bible as a podcast series with downloadable study guides.",
};

export default async function PodcastsPage() {
  const cards = await getPodcastCards().catch(() => []);
  return (
    <>
      <PageHeader
        eyebrow="The Library"
        title="Every book. Every study."
        subtitle={`${STATS.podcasts} series · ${STATS.episodes} episodes · ${STATS.guides} downloadable study guides. The first episode of each series is always free.`}
      />
      <div className="container-cb py-16 sm:py-20">
        <PodcastBrowser cards={cards} />
      </div>
    </>
  );
}

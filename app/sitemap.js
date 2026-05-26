import { getPodcasts, getAllEpisodes } from "@/lib/catalog";

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://concordiastudyguides.com";
  const now = new Date();

  const staticPages = [
    "", "/podcasts", "/pricing", "/search", "/about", "/faq",
    "/terms", "/privacy", "/login", "/signup",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  let allPodcasts = [], allEpisodes = [];
  try {
    [allPodcasts, allEpisodes] = await Promise.all([
      getPodcasts(),
      getAllEpisodes(),
    ]);
  } catch {
    // Supabase not reachable at build time — sitemap covers static routes only.
  }

  const podcastPages = allPodcasts.map((p) => ({
    url: `${base}/podcasts/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const episodePages = allEpisodes.map((e) => ({
    url: `${base}/episodes/${e.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...podcastPages, ...episodePages];
}

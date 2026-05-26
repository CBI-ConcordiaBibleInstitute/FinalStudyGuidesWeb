// Server-side data access layer. Every consumer page that was previously
// reading the static catalog.json now awaits these functions. Public pages
// pull `published=true` rows via RLS; admin pages (signed-in admin) see all.
//
// Client/admin components hit Supabase directly via lib/supabase/client.js
// or via the /api/search route. Constants and pure shape helpers live in
// lib/catalog-shared.js so they can be imported from anywhere.
// next/headers (used in getSupabaseServer) already prevents this module
// from being imported into a client component — Next will throw at build.
import { getSupabasePublic } from "@/lib/supabase/public";
import { shapePodcast, shapeEpisode } from "@/lib/catalog-shared";

export { SITE, TESTAMENTS, podcastImage } from "@/lib/catalog-shared";

// Lightweight stats used by /admin and a few marketing pages.
export async function getStats() {
  const sb = getSupabasePublic();
  const [podcasts, episodes, guides] = await Promise.all([
    sb.from("podcasts").select("slug", { count: "exact", head: true }).eq("published", true),
    sb.from("episodes").select("id",  { count: "exact", head: true }).eq("published", true),
    sb.from("episodes").select("id",  { count: "exact", head: true })
      .eq("published", true).not("guide_file", "is", null),
  ]);
  return {
    podcasts: podcasts.count ?? 0,
    episodes: episodes.count ?? 0,
    guides:   guides.count   ?? 0,
  };
}

export async function getPodcasts() {
  const sb = getSupabasePublic();
  const { data, error } = await sb
    .from("podcasts")
    .select("*, episodes(*)")
    .order("sort_order", { ascending: true })
    .order("number", { foreignTable: "episodes", ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => shapePodcast(row));
}

export async function getPodcast(slug) {
  const sb = getSupabasePublic();
  const { data, error } = await sb
    .from("podcasts")
    .select("*, episodes(*)")
    .eq("slug", slug)
    .order("number", { foreignTable: "episodes", ascending: true })
    .maybeSingle();
  if (error) throw error;
  return data ? shapePodcast(data) : null;
}

export async function getEpisode(id) {
  const sb = getSupabasePublic();
  const { data, error } = await sb
    .from("episodes")
    .select("*, podcast:podcasts(*, episodes(*))")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const ep = shapeEpisode(data);
  ep.podcast = shapePodcast(data.podcast);
  return ep;
}

export async function getAllEpisodes() {
  const sb = getSupabasePublic();
  const { data, error } = await sb
    .from("episodes")
    .select("*, podcasts(name)")
    .eq("published", true);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...shapeEpisode(row),
    podcastName: row.podcasts?.name,
  }));
}

export async function getPodcastCards() {
  // Same shape as getPodcasts() minus the full episode list — used in grids.
  // Includes the first 3 episode titles as a preview, matching the old API.
  const sb = getSupabasePublic();
  const { data, error } = await sb
    .from("podcasts")
    .select("*, episodes(title, number)")
    .order("sort_order", { ascending: true })
    .order("number", { foreignTable: "episodes", ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => {
    const eps = p.episodes ?? [];
    return {
      slug: p.slug,
      name: p.name,
      testament: p.testament,
      theme: p.theme,
      published: p.published,
      image: `/podcasts/${p.slug}.svg`,
      episodeCount: eps.length,
      freeCount: 0, // not used by cards UI; kept for API compatibility
      previewEpisodes: eps.slice(0, 3).map((e) => e.title),
    };
  });
}

export async function getFeatured(n = 6) {
  // Curated row across testaments — preserves the original ordering.
  const priority = [
    "top-40-texts", "genesis", "romans", "psalms", "revelation", "exodus",
  ];
  const cards = await getPodcastCards();
  const picked = priority
    .map((s) => cards.find((c) => c.slug === s))
    .filter(Boolean);
  return picked.slice(0, n);
}

export async function searchCatalog(query) {
  const q = query.trim();
  if (!q) return { episodes: [], podcasts: [] };
  const sb = getSupabasePublic();
  const like = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;

  const [podcastsRes, episodesRes] = await Promise.all([
    sb.from("podcasts")
      .select("*")
      .eq("published", true)
      .or(`name.ilike.${like},theme.ilike.${like},testament.ilike.${like}`),
    sb.from("episodes")
      .select("*, podcasts!inner(name)")
      .eq("published", true)
      .or(`title.ilike.${like},summary.ilike.${like}`)
      .limit(60),
  ]);
  if (podcastsRes.error) throw podcastsRes.error;
  if (episodesRes.error) throw episodesRes.error;

  return {
    podcasts: (podcastsRes.data ?? []).map((p) => ({
      slug: p.slug, name: p.name, testament: p.testament, theme: p.theme,
      image: `/podcasts/${p.slug}.svg`,
    })),
    episodes: (episodesRes.data ?? []).map((e) => ({
      ...shapeEpisode(e),
      podcastName: e.podcasts?.name,
    })),
  };
}

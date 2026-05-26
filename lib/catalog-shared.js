// Constants and pure helpers safe to import from both client and server.
// Data-fetching functions live in lib/catalog.js (server) and are reached
// via async server components / API routes on the client.

export const SITE = {
  name: "Concordia Bible Institute",
  short: "Concordia",
  podcast: "Christ in Every Word",
  tagline: "Read, mark, learn, and inwardly digest the sacred Scripture.",
  campus: "Concordia University Wisconsin",
  email: "contact@concordiastudyguides.com",
  youtube: "https://www.youtube.com/@concordiabible",
  price: 99,
};

export const TESTAMENTS = ["All", "Old Testament", "New Testament", "Featured"];

// Static reference numbers for marketing copy on client components where
// awaiting a count would force the whole tree async. Server pages should
// call getStats() in lib/catalog.js for live figures. Bump these when the
// library grows significantly.
export const STATS = { podcasts: 22, episodes: 319, guides: 319 };

// Reference cover image for a series — generated SVGs in /public/podcasts.
// Swap any file there for real artwork later (filename stays <slug>.svg).
export function podcastImage(slug) {
  return `/podcasts/${slug}.svg`;
}

// Reshape a podcasts row (snake_case from Postgres) into the camelCase shape
// the UI expects. Episodes optional — pass when joining episodes(*).
export function shapePodcast(row, episodes) {
  const eps = (episodes ?? row.episodes ?? []).map(shapeEpisode);
  return {
    slug: row.slug,
    name: row.name,
    testament: row.testament,
    theme: row.theme,
    published: row.published,
    image: podcastImage(row.slug),
    episodeCount: eps.length,
    freeCount: eps.filter((e) => e.free).length,
    episodes: eps,
  };
}

export function shapeEpisode(row) {
  return {
    id: row.id,
    podcastSlug: row.podcast_slug,
    number: row.number,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    youtubeUrl: row.youtube_url,
    youtubeId: row.youtube_id,
    duration: row.duration,
    free: !!row.free,
    guideFile: row.guide_file,
    guideFormat: row.guide_format,
    published: row.published,
  };
}

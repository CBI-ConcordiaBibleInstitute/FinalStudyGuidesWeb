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

// Custom artwork placed in /public/ArtWork — filenames are title-cased with
// the original names preserved. Falls back to the generated SVG for any
// series that doesn't have a matching art file yet.
const ARTWORK = {
  amos:            "/ArtWork/Amos.jpg",
  ecclesiastes:    "/ArtWork/Ecclesiastes.jpg",
  exodus:          "/ArtWork/Exodus.jpg",
  "song-of-songs": "/ArtWork/For%20Song%20of%20Songs.jpg",
  genesis:         "/ArtWork/Genesis.jpg",
  habakkuk:        "/ArtWork/Habakkuk.jpg",
  haggai:          "/ArtWork/Haggai.jpg",
  hosea:           "/ArtWork/Hosea.jpg",
  joel:            "/ArtWork/Joel.jpg",
  jonah:           "/ArtWork/Jonah.jpg",
  leviticus:       "/ArtWork/Leviticus.jpg",
  malachi:         "/ArtWork/Malachi.jpg",
  micah:           "/ArtWork/Micah.jpg",
  nahum:           "/ArtWork/Nahum.jpg",
  numbers:         "/ArtWork/Numbers.png",
  obadiah:         "/ArtWork/Obadiah.jpg",
  psalms:          "/ArtWork/Psalms.jpg",
  revelation:      "/ArtWork/Revelation.jpg",
  romans:          "/ArtWork/Romans.jpg",
  "top-40-texts":  "/ArtWork/Top40Texts.svg",
  zechariah:       "/ArtWork/Zechariah.jpg",
  zephaniah:       "/ArtWork/Zephaniah.jpg",
};

export function podcastImage(slug) {
  return ARTWORK[slug] ?? `/podcasts/${slug}.svg`;
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

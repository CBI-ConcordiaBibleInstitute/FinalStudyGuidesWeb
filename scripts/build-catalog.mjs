// Scans the FeaturedPdfs library, builds the platform catalog, and copies the
// PDF study guides into public/guides. YouTube URLs + transcript summaries are
// pulled from the matching folders under /downloads/Formatted (same filenames,
// .txt sidecars), so episode metadata is preserved when the source is PDF.
// Run: node scripts/build-catalog.mjs
import fs from "node:fs";
import path from "node:path";

// PDF study guides — what gets stored and displayed on the site.
const SOURCE = "/Users/sarithachalluri/Downloads/FeaturedPdfs";
// URL + transcript sidecar files (.txt) live alongside the original .docx set.
const META_SOURCE = "/Users/sarithachalluri/Downloads/Formatted";
const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_GUIDES = path.join(ROOT, "public", "guides");
const OUT = path.join(ROOT, "data", "catalog.json");

// Bible-book metadata: testament + a one-line theme used as the series blurb.
const BOOKS = {
  Genesis:      { name: "Genesis",         testament: "Old Testament", theme: "Origins of creation, covenant, and the promise of a Redeemer." },
  Exodus:       { name: "Exodus",          testament: "Old Testament", theme: "Deliverance, the Law, and God dwelling among His people." },
  Leviticus:    { name: "Leviticus",       testament: "Old Testament", theme: "Holiness, sacrifice, and atonement that points to Christ." },
  Numbers:      { name: "Numbers",         testament: "Old Testament", theme: "Wilderness wandering and the faithfulness of God." },
  Psalm:        { name: "Psalms",          testament: "Old Testament", theme: "The prayer book of the Church — lament, praise, and Messiah." },
  Ecclesiastes: { name: "Ecclesiastes",    testament: "Old Testament", theme: "Vanity, wisdom, and the search for meaning under the sun." },
  SongOfSongs:  { name: "Song of Songs",   testament: "Old Testament", theme: "Covenant love as a picture of Christ and His Church." },
  Hosea:        { name: "Hosea",           testament: "Old Testament", theme: "Steadfast love that pursues an unfaithful people." },
  Joel:         { name: "Joel",            testament: "Old Testament", theme: "The Day of the Lord and the outpouring of the Spirit." },
  Amos:         { name: "Amos",            testament: "Old Testament", theme: "Justice, righteousness, and the burden of God's Word." },
  Obadiah:      { name: "Obadiah",         testament: "Old Testament", theme: "Judgment on pride and the certainty of God's kingdom." },
  Jonah:        { name: "Jonah",           testament: "Old Testament", theme: "Mercy for the nations and a reluctant prophet." },
  Micah:        { name: "Micah",           testament: "Old Testament", theme: "The ruler from Bethlehem and what the Lord requires." },
  Nahum:        { name: "Nahum",           testament: "Old Testament", theme: "The Lord is slow to anger and great in power." },
  Habakkuk:     { name: "Habakkuk",        testament: "Old Testament", theme: "Living by faith in the face of unanswered questions." },
  Zephaniah:    { name: "Zephaniah",       testament: "Old Testament", theme: "The Day of the Lord and the singing of God over His people." },
  Haggi:        { name: "Haggai",          testament: "Old Testament", theme: "Rebuilding the house of God and renewed priorities." },
  Zenchariah:   { name: "Zechariah",       testament: "Old Testament", theme: "Visions of the coming King and the cleansing of His people." },
  Malachi:      { name: "Malachi",         testament: "Old Testament", theme: "The messenger of the covenant and the dawn of healing." },
  Romans:       { name: "Romans",          testament: "New Testament", theme: "The righteousness of God revealed in the Gospel." },
  Revelation:   { name: "Revelation",      testament: "New Testament", theme: "The unveiling of Christ and the hope of the new creation." },
  "Top-40":     { name: "Top 40 Texts",    testament: "Featured",      theme: "The forty most-loved passages across the whole of Scripture." },
};

const slugify = (s) =>
  s.toLowerCase().replace(/['']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Natural sort so "Genesis 2" comes before "Genesis 10".
const naturalCmp = (a, b) =>
  a.replace(/\d+/g, (n) => n.padStart(6, "0")).localeCompare(
    b.replace(/\d+/g, (n) => n.padStart(6, "0"))
  );

function cleanTitle(file) {
  return file
    .replace(/\.pdf$/i, "")
    .replace(/_/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function readUrls(dir) {
  if (!fs.existsSync(dir)) return [];
  const f = fs.readdirSync(dir).find((x) => /url/i.test(x) && x.endsWith(".txt"));
  if (!f) return [];
  return fs
    .readFileSync(path.join(dir, f), "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("http"));
}

// Map youtube URL -> first paragraph of its transcript, used as episode summary.
function readTranscripts(dir) {
  const map = {};
  if (!fs.existsSync(dir)) return map;
  const f = fs.readdirSync(dir).find((x) => /transcript/i.test(x) && x.endsWith(".txt"));
  if (!f) return map;
  const raw = fs.readFileSync(path.join(dir, f), "utf8");
  const blocks = raw.split(/VIDEO \d+/);
  for (const b of blocks) {
    const url = (b.match(/URL:\s*(\S+)/) || [])[1];
    const tIdx = b.indexOf("TRANSCRIPT:");
    if (url && tIdx !== -1) {
      let text = b.slice(tIdx + 11).replace(/\[Music\]/gi, "").replace(/\s+/g, " ").trim();
      map[url] = text;
    }
  }
  return map;
}

const ytId = (url) => (url.match(/[?&]v=([^&]+)/) || [])[1] || "";

function summarize(transcript, title) {
  if (transcript && transcript.length > 120) {
    let s = transcript.slice(0, 240);
    s = s.slice(0, s.lastIndexOf(" ")).trim();
    return s + "…";
  }
  return `A guided study of ${title}, opening the text of Scripture so you can read, mark, learn, and inwardly digest the Word of God.`;
}

fs.rmSync(PUBLIC_GUIDES, { recursive: true, force: true });
fs.mkdirSync(PUBLIC_GUIDES, { recursive: true });

const podcasts = [];
let episodeId = 0;
let totalGuides = 0;

for (const [folder, meta] of Object.entries(BOOKS)) {
  const dir = path.join(SOURCE, folder);
  if (!fs.existsSync(dir)) continue;

  const pdfs = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort(naturalCmp);
  if (!pdfs.length) continue;

  // Sidecar metadata (YouTube URLs, transcripts) keeps the same per-book order.
  const metaDir = path.join(META_SOURCE, folder);
  const urls = readUrls(metaDir);
  const transcripts = readTranscripts(metaDir);
  const pSlug = slugify(meta.name);

  fs.mkdirSync(path.join(PUBLIC_GUIDES, pSlug), { recursive: true });

  const episodes = pdfs.map((file, i) => {
    const title = cleanTitle(file);
    const gSlug = slugify(title);
    const dest = `${gSlug}.pdf`;
    fs.copyFileSync(path.join(dir, file), path.join(PUBLIC_GUIDES, pSlug, dest));
    totalGuides++;

    const url = urls[i] || urls[i % Math.max(urls.length, 1)] || "";
    const transcript = transcripts[url] || "";

    return {
      id: `ep-${++episodeId}`,
      podcastSlug: pSlug,
      number: i + 1,
      title,
      slug: gSlug,
      summary: summarize(transcript, title),
      youtubeUrl: url,
      youtubeId: ytId(url),
      guideFile: `/guides/${pSlug}/${dest}`,
      guideFormat: "pdf",
      free: i === 0, // first episode of every series is free
      duration: 22 + ((episodeId * 7) % 18), // pseudo runtime in minutes
    };
  });

  podcasts.push({
    slug: pSlug,
    name: meta.name,
    testament: meta.testament,
    theme: meta.theme,
    episodeCount: episodes.length,
    freeCount: 1,
    episodes,
  });
}

const catalog = {
  generatedAt: new Date().toISOString(),
  stats: {
    podcasts: podcasts.length,
    episodes: episodeId,
    guides: totalGuides,
  },
  podcasts,
};

fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2));
console.log(
  `Catalog built: ${podcasts.length} series, ${episodeId} episodes, ${totalGuides} PDF guides copied.`
);

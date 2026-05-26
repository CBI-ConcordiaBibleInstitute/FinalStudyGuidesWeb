// Generates a reference cover image (SVG) for every podcast series.
// These are placeholder "reference pictures" — swap any file in
// public/podcasts/ for real artwork later; the filename is <slug>.svg.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  readFileSync(join(root, "data", "catalog.json"), "utf8")
);
const outDir = join(root, "public", "podcasts");
mkdirSync(outDir, { recursive: true });

// A short motif word + accent hue per series, for visual variety.
const THEMES = {
  genesis: ["In the beginning", 8],
  exodus: ["Deliverance", 20],
  leviticus: ["Holiness", 32],
  numbers: ["The wilderness", 44],
  psalms: ["Songs of praise", 210],
  ecclesiastes: ["Vanity & meaning", 150],
  "song-of-songs": ["Love & longing", 330],
  hosea: ["Covenant love", 350],
  joel: ["The day of the Lord", 30],
  amos: ["Justice", 16],
  obadiah: ["Judgment of Edom", 12],
  jonah: ["Mercy to the nations", 195],
  micah: ["What the Lord requires", 260],
  nahum: ["The avenging God", 0],
  habakkuk: ["The just live by faith", 275],
  zephaniah: ["The day of wrath", 4],
  haggai: ["Rebuild the house", 36],
  zechariah: ["Visions of restoration", 240],
  malachi: ["The refiner's fire", 28],
  romans: ["Justified by faith", 225],
  revelation: ["Things to come", 280],
  "top-40-texts": ["The cornerstone texts", 45],
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function cover({ slug, name, testament }) {
  const [motif, hue] = THEMES[slug] || ["Christ in every word", 345];
  const initials = name
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  // Cohesive indigo -> violet palette. Each series keeps a subtle hue shift
  // inside the 250-288 band so the 22 covers feel like one family.
  const h = 250 + (hue % 38);
  const top = `hsl(${h}, 72%, 28%)`;
  const mid = `hsl(${h + 6}, 78%, 18%)`;
  const bottom = `hsl(${h + 10}, 82%, 11%)`;
  const accent = `hsl(${h}, 90%, 80%)`; // light violet accent
  const cream = "#F4F2FF";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${esc(name)} series cover">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="0.55" stop-color="${mid}"/>
      <stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.34" r="0.7">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.34"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  <rect x="40" y="40" width="1120" height="595" rx="20" fill="none" stroke="${accent}" stroke-width="2" opacity="0.45"/>
  <rect x="52" y="52" width="1096" height="571" rx="14" fill="none" stroke="${accent}" stroke-width="1" opacity="0.22"/>
  <circle cx="600" cy="250" r="118" fill="none" stroke="${accent}" stroke-width="3" opacity="0.8"/>
  <circle cx="600" cy="250" r="100" fill="${accent}" opacity="0.12"/>
  <text x="600" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="120" font-weight="700"
        fill="${accent}" text-anchor="middle" dominant-baseline="central">${esc(initials)}</text>
  <text x="600" y="455" font-family="Georgia, 'Times New Roman', serif" font-size="78" font-weight="700"
        fill="${cream}" text-anchor="middle">${esc(name)}</text>
  <text x="600" y="510" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-style="italic"
        fill="${accent}" text-anchor="middle">${esc(motif)}</text>
  <text x="600" y="585" font-family="Arial, Helvetica, sans-serif" font-size="22" letter-spacing="6"
        fill="${cream}" fill-opacity="0.7" text-anchor="middle">${esc(testament.toUpperCase())}</text>
</svg>
`;
}

let n = 0;
for (const p of catalog.podcasts) {
  writeFileSync(join(outDir, `${p.slug}.svg`), cover(p));
  n++;
}
console.log(`Wrote ${n} podcast cover images to public/podcasts/`);

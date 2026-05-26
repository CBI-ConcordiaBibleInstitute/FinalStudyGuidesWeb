#!/usr/bin/env node
// Seed Supabase from data/catalog.json. Idempotent — upserts on primary key,
// so re-running won't duplicate rows. Run with:
//   node scripts/seed-supabase.mjs
//
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

// ─── Load .env.local manually (Next.js loads it at runtime, but scripts don't).
async function loadDotEnv() {
  try {
    const raw = await readFile(join(repoRoot, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      const [, k, v] = m;
      if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local not present — caller must export the vars another way.
  }
}

async function main() {
  await loadDotEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("✖ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    console.error("  Add them to .env.local first.");
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const catalog = JSON.parse(
    await readFile(join(repoRoot, "data", "catalog.json"), "utf8")
  );

  const podcasts = catalog.podcasts.map((p, i) => ({
    slug: p.slug,
    name: p.name,
    testament: p.testament,
    theme: p.theme,
    sort_order: i,
    published: true,
  }));

  const episodes = catalog.podcasts.flatMap((p) =>
    p.episodes.map((e) => ({
      id: e.id,
      podcast_slug: p.slug,
      number: e.number,
      title: e.title,
      slug: e.slug,
      summary: e.summary,
      youtube_url: e.youtubeUrl,
      youtube_id: e.youtubeId,
      duration: e.duration,
      free: !!e.free,
      // Strip the legacy /guides/ prefix so the column holds a bucket path
      // (e.g. "genesis/abraham-study-guide-20.pdf") that the storage client
      // and the /api/guides/[id] route can consume directly.
      guide_file: e.guideFile ? e.guideFile.replace(/^\/guides\//, "") : null,
      guide_format: e.guideFormat ?? "pdf",
      published: true,
    }))
  );

  console.log(`→ Upserting ${podcasts.length} podcasts…`);
  // Series first (episodes FK them).
  const { error: pErr } = await sb.from("podcasts").upsert(podcasts, { onConflict: "slug" });
  if (pErr) throw pErr;

  console.log(`→ Upserting ${episodes.length} episodes…`);
  // Batched — Supabase rejects payloads above ~1MB.
  const batchSize = 200;
  for (let i = 0; i < episodes.length; i += batchSize) {
    const batch = episodes.slice(i, i + batchSize);
    const { error: eErr } = await sb.from("episodes").upsert(batch, { onConflict: "id" });
    if (eErr) throw eErr;
    process.stdout.write(`  …${Math.min(i + batchSize, episodes.length)}/${episodes.length}\r`);
  }
  console.log();
  console.log("✓ Seed complete.");
  console.log();
  console.log("Next steps:");
  console.log("  1. Sign up at /signup with the email you want as admin.");
  console.log("  2. In Supabase SQL editor, promote yourself:");
  console.log("       update profiles set role='admin' where email='YOUR@EMAIL.COM';");
  console.log("  3. Log in at /login → visit /admin.");
}

main().catch((e) => {
  console.error("✖ Seed failed:", e.message ?? e);
  process.exit(1);
});

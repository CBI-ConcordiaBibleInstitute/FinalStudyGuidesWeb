#!/usr/bin/env node
// Bulk-upload every study-guide PDF to the private `study-guides` Supabase
// Storage bucket. Reads paths from episodes.guide_file (set by the seed
// step) and finds each source file under ./public/guides/<path>.
//
// Idempotent: upsert: true overwrites if the object already exists. Safe to
// re-run if a previous run was interrupted.
//
// Run:  node scripts/upload-pdfs.mjs

import { createClient } from "@supabase/supabase-js";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const LOCAL_GUIDES = join(repoRoot, "public", "guides");
const BUCKET = "study-guides";
const CONCURRENCY = 4;

async function loadDotEnv() {
  try {
    const raw = await readFile(join(repoRoot, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      const [, k, v] = m;
      if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, "");
    }
  } catch {}
}

async function uploadOne(sb, path) {
  const localPath = join(LOCAL_GUIDES, path);
  try {
    await stat(localPath);
  } catch {
    return { path, status: "missing", error: `local file not found at public/guides/${path}` };
  }
  const buf = await readFile(localPath);
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, {
    upsert: true,
    contentType: "application/pdf",
  });
  if (error) return { path, status: "failed", error: error.message };
  return { path, status: "uploaded" };
}

async function main() {
  await loadDotEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("✖ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  console.log("→ Fetching episode guide paths from Supabase…");
  const { data: rows, error } = await sb
    .from("episodes")
    .select("id, guide_file")
    .not("guide_file", "is", null);
  if (error) { console.error("✖", error.message); process.exit(1); }

  const paths = rows.map((r) => r.guide_file).filter(Boolean);
  console.log(`→ ${paths.length} PDFs to upload to bucket "${BUCKET}" (concurrency=${CONCURRENCY}).`);

  const counts = { uploaded: 0, missing: 0, failed: 0 };
  const failures = [];
  let inFlight = 0;
  let idx = 0;
  let done = 0;

  await new Promise((resolve) => {
    const kick = () => {
      while (inFlight < CONCURRENCY && idx < paths.length) {
        const path = paths[idx++];
        inFlight++;
        uploadOne(sb, path)
          .then((res) => {
            counts[res.status]++;
            if (res.status !== "uploaded") failures.push(res);
            done++;
            process.stdout.write(`  …${done}/${paths.length}  (ok:${counts.uploaded} miss:${counts.missing} fail:${counts.failed})\r`);
          })
          .catch((e) => {
            counts.failed++;
            failures.push({ path, status: "failed", error: e.message ?? String(e) });
            done++;
          })
          .finally(() => {
            inFlight--;
            if (done === paths.length) resolve();
            else kick();
          });
      }
    };
    kick();
  });

  console.log();
  console.log(`✓ uploaded:${counts.uploaded}  missing:${counts.missing}  failed:${counts.failed}`);
  if (failures.length) {
    console.log("\nProblems:");
    for (const f of failures.slice(0, 20)) console.log(`  [${f.status}] ${f.path} — ${f.error}`);
    if (failures.length > 20) console.log(`  …and ${failures.length - 20} more`);
    process.exit(counts.failed > 0 ? 1 : 0);
  }
}

main().catch((e) => {
  console.error("✖ Upload failed:", e.message ?? e);
  process.exit(1);
});

#!/usr/bin/env node
// Re-convert every study guide .docx in ~/Downloads/Formatted/<Book>/
// to a high-fidelity PDF in ~/Downloads/FeaturedPdfs/<Book>/.
//
// Drives Microsoft Word via scripts/convert-all.jxa — keeps Word open across
// the whole batch and retries individual files on AppleEvent timeouts, so a
// single hiccup doesn't kill the rest of the run.
//
// Usage:
//   node scripts/convert-docx-to-pdf.mjs                       # all books
//   node scripts/convert-docx-to-pdf.mjs Exodus Genesis        # specific books
//   node scripts/convert-docx-to-pdf.mjs --only-stale          # skip PDFs newer than docx

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HOME = os.homedir();
const SRC_ROOT = path.join(HOME, "Downloads", "Formatted");
const OUT_ROOT = path.join(HOME, "Downloads", "FeaturedPdfs");
const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const JXA_SCRIPT = path.join(REPO_ROOT, "scripts", "convert-all.jxa");

const args = process.argv.slice(2);
const ONLY_STALE = args.includes("--only-stale");
const onlyBooks = args.filter((a) => !a.startsWith("--"));

const books = fs
  .readdirSync(SRC_ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((b) => (onlyBooks.length ? onlyBooks.includes(b) : true))
  .sort();

if (!books.length) {
  console.error(`✖ No book folders found under ${SRC_ROOT}` +
    (onlyBooks.length ? ` matching ${onlyBooks.join(", ")}` : ""));
  process.exit(1);
}

// Build the job list — one (input, output) pair per .docx that needs work.
const jobs = [];
for (const book of books) {
  const srcDir = path.join(SRC_ROOT, book);
  const outDir = path.join(OUT_ROOT, book);
  fs.mkdirSync(outDir, { recursive: true });
  const allDocx = fs.readdirSync(srcDir).filter((f) => f.toLowerCase().endsWith(".docx"));
  for (const f of allDocx) {
    const input = path.join(srcDir, f);
    const output = path.join(outDir, f.replace(/\.docx$/i, ".pdf"));
    if (ONLY_STALE && fs.existsSync(output)) {
      const inMtime = fs.statSync(input).mtimeMs;
      const outMtime = fs.statSync(output).mtimeMs;
      if (outMtime > inMtime) continue;
    }
    jobs.push({ input, output, book });
  }
}

if (!jobs.length) {
  console.log("✓ nothing to do — every PDF is newer than its docx");
  process.exit(0);
}

console.log(`→ Converting ${jobs.length} docx across ${books.length} books`);
console.log(`  source : ${SRC_ROOT}`);
console.log(`  output : ${OUT_ROOT}`);

const tsv = jobs.map((j) => `${j.input}\t${j.output}`).join("\n") + "\n";
const jobsPath = path.join(os.tmpdir(), `cbi-docx-jobs-${Date.now()}.tsv`);
fs.writeFileSync(jobsPath, tsv);

const proc = spawn("osascript", ["-l", "JavaScript", JXA_SCRIPT, jobsPath], {
  stdio: ["ignore", "inherit", "pipe"],
});

let buf = "";
let done = 0, ok = 0, failed = 0;
const failures = [];

// osascript -l JavaScript routes console.log() through stderr, so that's
// where the per-file JSON arrives.
proc.stderr.on("data", (chunk) => {
  buf += chunk.toString();
  let newlineIdx;
  while ((newlineIdx = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, newlineIdx).trim();
    buf = buf.slice(newlineIdx + 1);
    if (!line) continue;
    let result;
    try { result = JSON.parse(line); } catch { continue; }
    if (result.status === "ok") {
      ok++;
      done++;
      process.stdout.write(`  [${done}/${jobs.length}] ok   ${shortPath(result.output)} (${(result.elapsed_ms/1000).toFixed(1)}s${result.attempts > 1 ? `, retry ×${result.attempts-1}` : ""})\n`);
    } else if (result.status === "failed") {
      failed++;
      done++;
      failures.push(result);
      process.stdout.write(`  [${done}/${jobs.length}] FAIL ${shortPath(result.output)} — ${result.error}\n`);
    } else if (result.status === "fatal") {
      console.error(`✖ JXA fatal: ${result.error}`);
      process.exit(2);
    }
  }
});

proc.on("close", (code) => {
  fs.rmSync(jobsPath, { force: true });
  console.log();
  console.log(`✓ converted: ${ok}   failed: ${failed}   (jxa exit ${code})`);
  if (failures.length) {
    console.log("\nFailed files:");
    for (const f of failures.slice(0, 30)) console.log(`  - ${shortPath(f.input)} → ${f.error}`);
    if (failures.length > 30) console.log(`  …and ${failures.length - 30} more`);
    process.exit(1);
  }
});

function shortPath(p) {
  return p.replace(OUT_ROOT + "/", "").replace(SRC_ROOT + "/", "");
}

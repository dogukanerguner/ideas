// Usage:
//   npm run add -- https://github.com/owner/repo [owner/repo ...] [--note "why"] [--category slug]
//   npm run refresh                      # re-fetch every repo (stars, topics, README, category)
//   node scripts/add.ts --from-issue     # reads URLs from $ISSUE_BODY (GitHub Action)
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRepoRecord, parseRepoInput, repoFileName } from "../lib/github.ts";
import { CATEGORY_MAP } from "../lib/taxonomy.ts";
import type { Repo } from "../lib/types.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "data", "repos");

function token(): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execSync("gh auth token", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || undefined;
  } catch {
    return undefined;
  }
}

const args = process.argv.slice(2);
let note: string | undefined;
let category: string | undefined;
const inputs: string[] = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--note") note = args[++i];
  else if (a === "--category") category = args[++i];
  else if (a === "--refresh") {
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      inputs.push((JSON.parse(readFileSync(join(dir, f), "utf8")) as Repo).fullName);
    }
  } else if (a === "--from-issue") {
    const body = process.env.ISSUE_BODY ?? "";
    for (const m of body.matchAll(/(?:https?:\/\/)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/g)) inputs.push(m[0]);
    const n = body.match(/### (?:Why is it useful\?|Note)\s+([\s\S]*?)(?:\n###|$)/);
    if (n && !/_No response_/.test(n[1])) note = n[1].trim().slice(0, 280);
    const c = body.match(/### Category[^\n]*\s+([a-z-]+)/);
    if (c && CATEGORY_MAP[c[1]]) category = c[1];
  } else inputs.push(a);
}
if (category && !CATEGORY_MAP[category]) {
  console.error(`Unknown category "${category}". Valid: ${Object.keys(CATEGORY_MAP).join(", ")}`);
  process.exit(1);
}
if (!inputs.length) {
  console.error("Give me at least one GitHub URL or owner/repo.");
  process.exit(1);
}

const tok = token();
const added: string[] = [];
const failed: string[] = [];
const queue = [...new Set(inputs)];
const CONCURRENCY = 6;
async function worker() {
  while (queue.length) {
    const input = queue.shift()!;
    const p = parseRepoInput(input);
    if (!p) { failed.push(`${input} (not a repo URL)`); continue; }
    const file = join(dir, repoFileName(`${p.owner}/${p.name}`));
    const existing = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Repo) : null;
    try {
      const rec = await fetchRepoRecord(input, { token: tok, existing, note: args.includes("--refresh") ? undefined : note, category });
      // the API may resolve renamed repos; write under the canonical name
      writeFileSync(join(dir, repoFileName(rec.fullName)), JSON.stringify(rec, null, 2) + "\n");
      added.push(`${rec.fullName.padEnd(42)} ★${String(rec.stars).padStart(7)}  → ${rec.category}  [${rec.tags.slice(0, 5).join(", ")}]`);
    } catch (e) {
      failed.push(`${input} (${(e as Error).message})`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
for (const l of added.sort()) console.log("✓", l);
for (const l of failed) console.log("✗", l);
console.log(`\n${added.length} saved, ${failed.length} failed`);
execSync("node scripts/build-index.mjs", { cwd: root, stdio: "inherit" });
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `added<<EOF\n${added.join("\n")}\nEOF\nfailed<<EOF\n${failed.join("\n")}\nEOF\n`, { flag: "a" });
}

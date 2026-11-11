// Combines data/repos/*.json into data/index.json (imported by the app at build time).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "data", "repos");
const repos = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")))
  .sort((a, b) => b.stars - a.stars);
writeFileSync(join(root, "data", "index.json"), JSON.stringify({ generatedAt: new Date().toISOString(), repos }));
console.log(`ideas: indexed ${repos.length} repos`);

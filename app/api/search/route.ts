import { allDocs } from "@/lib/data";
import { json, md, wantsMd } from "@/lib/http";
import { docLine, repoUrl } from "@/lib/md";
import { searchDocs } from "@/lib/search";
import { CATEGORY_MAP } from "@/lib/taxonomy";

export function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").slice(0, 300);
  const category = u.searchParams.get("category") ?? undefined;
  const tag = u.searchParams.get("tag") ?? undefined;
  const limit = Math.min(50, Math.max(1, Number(u.searchParams.get("limit")) || 10));
  if (category && !CATEGORY_MAP[category]) return json({ error: `Unknown category. Valid: ${Object.keys(CATEGORY_MAP).join(", ")}` }, 400);
  let docs = allDocs();
  if (tag) docs = docs.filter((d) => d.tags.includes(tag));
  const hits = searchDocs(docs, q, { category, limit });
  if (wantsMd(req)) return md(`# Search: ${q || "(top repos)"}${category ? ` in ${category}` : ""}\n\n${hits.map((h) => docLine(h.doc)).join("\n") || "No results."}\n`);
  return json({ query: q, category: category ?? null, count: hits.length, results: hits.map((h) => ({ ...h.doc, score: Math.round(h.score * 10) / 10, url: `https://github.com/${h.doc.fullName}`, page: repoUrl(h.doc) })) });
}

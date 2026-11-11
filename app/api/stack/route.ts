import { allDocs } from "@/lib/data";
import { json, md, wantsMd } from "@/lib/http";
import { repoUrl, stackMd } from "@/lib/md";
import { buildStack } from "@/lib/search";
import type { Doc } from "@/lib/types";

const slim = (d: Doc) => ({ fullName: d.fullName, description: d.description, stars: d.stars, language: d.language, category: d.category, tags: d.tags, vibe: d.vibe, url: `https://github.com/${d.fullName}`, page: repoUrl(d) });

export function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? u.searchParams.get("project") ?? "").trim().slice(0, 400);
  if (!q) return wantsMd(req) ? md("# Stack builder\n\nAdd `?q=<one-sentence project description>` — e.g. `?q=AI SaaS with auth and payments&format=md`\n", 400) : json({ error: "Missing ?q= (project description)" }, 400);
  const s = buildStack(allDocs(), q);
  if (wantsMd(req)) return md(stackMd(s));
  return json({ query: s.query, needs: s.needs.map((n) => ({ ...n, picks: n.picks.map(slim) })), more: s.more.map(slim) });
}

import { alternatives, allRepos, fmtStars, getRepo } from "@/lib/data";
import { OG_SIZE, paletteOg } from "@/lib/og";
import { getCategory } from "@/lib/taxonomy";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Repository on ideas";

export function generateStaticParams() {
  return allRepos().map((r) => ({ owner: r.owner, repo: r.name }));
}

export default async function OG({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const r = getRepo(owner, repo)!;
  const c = getCategory(r.category);
  const alts = alternatives(r, 3);
  return paletteOg({
    query: r.fullName,
    rows: [
      { title: r.name, sub: r.description, right: `${fmtStars(r.stars)} stars`, color: c.color, selected: true },
      ...alts.map((a) => ({ title: a.name, sub: a.description, right: `${fmtStars(a.stars)} stars`, color: getCategory(a.category).color })),
    ],
    footer: `${c.name} · vibe ${r.vibe}/100 · ideas.asveas.com`,
  });
}

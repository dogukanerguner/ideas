import { allRepos } from "@/lib/data";
import { fmtStars } from "@/lib/data";
import { OG_SIZE, paletteOg } from "@/lib/og";
import { getCategory } from "@/lib/taxonomy";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "ideas — the repo launcher for vibecoders";

export default function OG() {
  const top = [...allRepos()].sort((a, b) => b.vibe - a.vibe).slice(0, 4);
  return paletteOg({
    query: "Every repo worth vibing with.",
    rows: top.map((r, i) => ({ title: r.name, sub: r.description, right: `${fmtStars(r.stars)} stars`, color: getCategory(r.category).color, selected: i === 0 })),
    footer: `ideas.asveas.com · ${allRepos().length} repos`,
  });
}

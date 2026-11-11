import { allDocs, categoryCounts, popularTags } from "./data.ts";
import { getCategory } from "./taxonomy.ts";
import type { PaletteData } from "../components/Palette.tsx";

export function paletteData(): PaletteData {
  return {
    docs: allDocs(),
    cats: categoryCounts().filter((c) => c.count).map(({ slug, count }) => {
      const c = getCategory(slug);
      return { slug, name: c.name, color: c.color, glyph: c.glyph, count };
    }),
    tags: popularTags(2).slice(0, 150),
  };
}

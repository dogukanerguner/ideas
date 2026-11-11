import { getRepo, tagIndex } from "@/lib/data";
import { md } from "@/lib/http";
import { categoryMd, repoMd, tagMd } from "@/lib/md";
import { CATEGORY_MAP } from "@/lib/taxonomy";

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const [kind, a, b] = path.map((p) => decodeURIComponent(p).replace(/\.md$/, ""));
  if (kind === "r" && a && b) {
    const r = getRepo(a, b);
    if (r) return md(repoMd(r));
  } else if (kind === "c" && a && CATEGORY_MAP[a]) return md(categoryMd(a));
  else if (kind === "t" && a && tagIndex().has(a)) return md(tagMd(a));
  return md("# Not found\n\nSee https://ideas.asveas.com/llms.txt\n", 404);
}

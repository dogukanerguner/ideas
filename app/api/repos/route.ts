import { allRepos, GENERATED_AT } from "@/lib/data";
import { SITE } from "@/lib/site";
import { CATEGORIES } from "@/lib/taxonomy";
export const dynamic = "force-static";
export function GET() {
  return Response.json({
    name: SITE.name,
    url: SITE.url,
    generatedAt: GENERATED_AT,
    count: allRepos().length,
    categories: CATEGORIES.map(({ keywords: _k, ...c }) => c),
    repos: allRepos().map((r) => ({ ...r, page: `${SITE.url}/r/${r.owner}/${r.name}` })),
  });
}

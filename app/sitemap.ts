import type { MetadataRoute } from "next";
import { allRepos, categoryCounts, GENERATED_AT, popularTags } from "@/lib/data";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date(GENERATED_AT);
  return [
    { url: SITE.url, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...["/stack", "/c", "/t", "/ai", "/add", "/brand"].map((p) => ({ url: `${SITE.url}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...categoryCounts().filter((c) => c.count).map((c) => ({ url: `${SITE.url}/c/${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...allRepos().map((r) => ({ url: `${SITE.url}/r/${r.owner}/${r.name}`, lastModified: new Date(r.updatedAt), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...popularTags(3).map((t) => ({ url: `${SITE.url}/t/${t.tag}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}

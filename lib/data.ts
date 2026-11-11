import index from "../data/index.json";
import { CATEGORIES, getCategory } from "./taxonomy.ts";
import type { Doc, Repo } from "./types.ts";

const DAY = 86_400_000;
const NOW = Date.now();

export const GENERATED_AT: string = (index as { generatedAt: string }).generatedAt;

export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((NOW - new Date(iso).getTime()) / DAY));
}

/** 0–100: popularity (log stars) + freshness + hygiene. */
export function vibeScore(r: Repo): number {
  const pop = Math.min(1, Math.log10(Math.max(10, r.stars)) / Math.log10(250_000)) * 58;
  const d = daysSince(r.pushedAt);
  const fresh = r.archived ? 0 : d <= 7 ? 24 : d <= 30 ? 20 : d <= 90 ? 14 : d <= 365 ? 6 : 0;
  const hygiene = (r.license ? 6 : 0) + (r.homepage ? 4 : 0) + (r.topics.length >= 3 ? 4 : 0) + (r.readme ? 4 : 0);
  return Math.round(Math.min(100, pop + fresh + hygiene));
}

const repos: (Repo & { vibe: number })[] = ((index as { repos: Repo[] }).repos ?? []).map((r) => ({ ...r, vibe: vibeScore(r) }));
const byId = new Map(repos.map((r) => [r.id, r]));

export type RepoV = Repo & { vibe: number };

export function allRepos(): RepoV[] {
  return repos;
}

export function getRepo(owner: string, name: string): RepoV | undefined {
  return byId.get(`${owner}/${name}`.toLowerCase());
}

export function toDoc(r: RepoV): Doc {
  return {
    id: r.id, fullName: r.fullName, owner: r.owner, name: r.name, description: richDescription(r), stars: r.stars,
    language: r.language, category: r.category, categories: r.categories, tags: r.tags, topics: r.topics,
    vibe: r.vibe, avatar: r.avatar, addedAt: r.addedAt, readme: r.readme,
  };
}

/** GitHub descriptions are sometimes empty or just the name ("Friction Graphics"): fall back to the README's first sentence */
export function richDescription(r: Repo): string {
  const d = r.description.trim();
  if (d.length >= 40 || !r.readme) return d;
  const first = r.readme.split(/(?<=[.!?])\s/)[0].slice(0, 160).trim();
  return d ? `${d} · ${first}` : first;
}

let docsCache: Doc[] | null = null;
export function allDocs(): Doc[] {
  return (docsCache ??= repos.map(toDoc));
}

export function reposInCategory(slug: string): RepoV[] {
  return repos.filter((r) => r.categories.includes(slug)).sort((a, b) => (a.category === slug ? 0 : 1) - (b.category === slug ? 0 : 1) || b.vibe - a.vibe);
}

export function categoryCounts(): { slug: string; count: number }[] {
  return CATEGORIES.map((c) => ({ slug: c.slug, count: repos.filter((r) => r.category === c.slug).length }));
}

let tagCache: Map<string, RepoV[]> | null = null;
export function tagIndex(): Map<string, RepoV[]> {
  if (tagCache) return tagCache;
  const m = new Map<string, RepoV[]>();
  for (const r of repos) for (const t of r.tags) (m.get(t) ?? m.set(t, []).get(t)!).push(r);
  for (const l of m.values()) l.sort((a, b) => b.vibe - a.vibe);
  return (tagCache = m);
}

/** tags with at least `min` repos — only these get their own pages (no thin content) */
export function popularTags(min = 3): { tag: string; count: number }[] {
  return [...tagIndex().entries()].filter(([, l]) => l.length >= min).map(([tag, l]) => ({ tag, count: l.length })).sort((a, b) => b.count - a.count);
}

export function alternatives(r: RepoV, n = 6): RepoV[] {
  return reposInCategory(r.category).filter((x) => x.id !== r.id).slice(0, n);
}

export function related(r: RepoV, n = 6, exclude: Set<string> = new Set()): RepoV[] {
  const tags = new Set(r.tags);
  return repos
    .filter((x) => x.id !== r.id && !exclude.has(x.id))
    .map((x) => ({ x, s: x.tags.filter((t) => tags.has(t)).length + (x.categories.includes(r.category) ? 1 : 0) }))
    .filter((o) => o.s >= 2)
    .sort((a, b) => b.s - a.s || b.x.vibe - a.x.vibe)
    .slice(0, n)
    .map((o) => o.x);
}

export function fmtStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);
}

export function ago(iso: string): string {
  const d = daysSince(iso);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  if (d < 365) return `${Math.round(d / 30)} months ago`;
  return `${(d / 365).toFixed(1).replace(/\.0$/, "")} years ago`;
}

export function useWhenSentence(r: RepoV): string {
  const c = getCategory(r.category);
  return `Reach for ${r.name} when ${c.useWhen}${r.language ? ` — it's written in ${r.language}` : ""}${r.tags.length ? ` and fits stacks tagged ${r.tags.filter((t) => t !== (r.language ?? "").toLowerCase()).slice(0, 4).join(", ")}` : ""}.`;
}

export function maintenanceSentence(r: RepoV): string {
  if (r.archived) return `${r.fullName} is archived on GitHub, so it no longer receives updates.`;
  const d = daysSince(r.pushedAt);
  const status = d <= 30 ? "very actively maintained" : d <= 180 ? "actively maintained" : d <= 365 ? "maintained, but updates are slowing" : "quiet — no recent pushes";
  return `${r.fullName} looks ${status}: the last push was ${ago(r.pushedAt)} (${r.pushedAt.slice(0, 10)}), with ${r.stars.toLocaleString("en-US")} stars and ${r.openIssues.toLocaleString("en-US")} open issues.`;
}

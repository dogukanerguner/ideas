import { classify, extractTags } from "./classify.ts";
import type { Repo } from "./types.ts";

export function parseRepoInput(input: string): { owner: string; name: string } | null {
  const s = input.trim().replace(/\.git$/, "").replace(/\/+$/, "");
  const m =
    s.match(/github\.com[/:]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i) ??
    s.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (!m) return null;
  return { owner: m[1], name: m[2] };
}

type GhRepo = {
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  html_url: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  license: { spdx_id: string | null; name: string } | null;
  topics?: string[];
  created_at: string;
  pushed_at: string;
  archived: boolean;
  private: boolean;
};

async function gh(path: string, token?: string, accept = "application/vnd.github+json"): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: accept,
      "User-Agent": "ideas-portal",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/** Turn a raw README into a short, human paragraph (no badges, html, code). */
export function cleanReadme(md: string): { excerpt: string; text: string } {
  let t = md
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<(picture|table|svg|style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, " ")
    .replace(/&nbsp;|&amp;|&#\d+;/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~]{1,3}([^*_~\n]+)[*_~]{1,3}/g, "$1");
  const text = t.replace(/\s+/g, " ").trim();
  const paras = t
    .split(/\n\s*\n/)
    .map((p) => p.replace(/^#+\s.*$/gm, "").replace(/^\s*[-*>|]\s*/gm, "").replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 70 && !/^(table of contents|contents|license|installation)\b/i.test(p) && !/\|.*\|/.test(p) && (p.match(/[a-z]/gi)?.length ?? 0) > p.length * 0.6);
  let excerpt = "";
  for (const p of paras) {
    if (excerpt.length > 260) break;
    excerpt += (excerpt ? " " : "") + p;
  }
  if (excerpt.length > 720) excerpt = excerpt.slice(0, 700).replace(/\s+\S*$/, "") + "…";
  return { excerpt, text };
}

export class RepoFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchRepoRecord(
  input: string,
  opts: { token?: string; existing?: Repo | null; note?: string; category?: string } = {},
): Promise<Repo> {
  const parsed = parseRepoInput(input);
  if (!parsed) throw new RepoFetchError(`Not a GitHub repository: ${input}`, 400);
  const res = await gh(`/repos/${parsed.owner}/${parsed.name}`, opts.token);
  if (res.status === 404) throw new RepoFetchError(`Repository not found: ${parsed.owner}/${parsed.name}`, 404);
  if (!res.ok) throw new RepoFetchError(`GitHub API error ${res.status}: ${(await res.text()).slice(0, 200)}`, res.status);
  const r = (await res.json()) as GhRepo;
  if (r.private) throw new RepoFetchError("Private repositories are not supported", 400);

  let readmeRaw = "";
  const rr = await gh(`/repos/${r.full_name}/readme`, opts.token, "application/vnd.github.raw+json");
  if (rr.ok) readmeRaw = await rr.text();
  const { excerpt, text } = cleanReadme(readmeRaw);

  const topics = r.topics ?? [];
  const input2 = { name: r.name, description: r.description ?? "", topics, language: r.language, readme: text };
  const auto = classify(input2);
  const tags = extractTags(input2);

  const existing = opts.existing;
  const forced = opts.category ?? (existing?.manualCategory ? existing.category : undefined);
  const category = forced ?? auto.category;
  const categories = [category, ...auto.categories.filter((c) => c !== category)].slice(0, 3);
  const now = new Date().toISOString();

  const rec: Repo = {
    id: r.full_name.toLowerCase(),
    owner: r.owner.login,
    name: r.name,
    fullName: r.full_name,
    url: r.html_url,
    description: (r.description ?? "").trim(),
    homepage: r.homepage?.trim() || null,
    stars: r.stargazers_count,
    forks: r.forks_count,
    openIssues: r.open_issues_count,
    language: r.language,
    license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : r.license?.name ?? null,
    topics,
    createdAt: r.created_at,
    pushedAt: r.pushed_at,
    archived: r.archived,
    avatar: r.owner.avatar_url,
    readme: excerpt,
    category,
    categories,
    tags,
    addedAt: existing?.addedAt ?? now,
    updatedAt: now,
  };
  const note = opts.note ?? existing?.note;
  if (note) rec.note = note;
  if (forced) rec.manualCategory = true;
  return rec;
}

export function repoFileName(fullName: string): string {
  return `${fullName.toLowerCase().replace("/", "__")}.json`;
}

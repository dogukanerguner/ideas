/* Markdown renderings — what AI agents read (llms.txt, .md pages, API ?format=md, MCP). */
import { alternatives, allRepos, ago, categoryCounts, fmtStars, GENERATED_AT, maintenanceSentence, popularTags, reposInCategory, tagIndex, useWhenSentence, type RepoV } from "./data.ts";
import type { StackResult } from "./search.ts";
import { CATEGORIES, getCategory } from "./taxonomy.ts";
import { SITE } from "./site.ts";
import type { Doc } from "./types.ts";

export const repoPath = (r: { owner: string; name: string }) => `/r/${r.owner}/${r.name}`;
export const repoUrl = (r: { owner: string; name: string }) => `${SITE.url}${repoPath(r)}`;

export function docLine(d: Doc | RepoV): string {
  return `- [${d.fullName}](https://github.com/${d.fullName}) — ${d.description || "No description."} (★${fmtStars(d.stars)}${d.language ? `, ${d.language}` : ""}, vibe ${d.vibe}/100) · details: ${repoUrl(d)}`;
}

export function repoMd(r: RepoV): string {
  const c = getCategory(r.category);
  const alts = alternatives(r, 6);
  return `# ${r.fullName}

> ${r.description || "No description provided."}

- GitHub: ${r.url}
${r.homepage ? `- Website: ${r.homepage}\n` : ""}- Category: ${c.name} (${SITE.url}/c/${c.slug})${r.categories.length > 1 ? `; also ${r.categories.slice(1).map((s) => getCategory(s).name).join(", ")}` : ""}
- Tags: ${r.tags.join(", ") || "—"}
- Language: ${r.language ?? "—"} · License: ${r.license ?? "unknown"}
- Stars: ${r.stars.toLocaleString("en-US")} · Forks: ${r.forks.toLocaleString("en-US")} · Open issues: ${r.openIssues.toLocaleString("en-US")}
- Last push: ${r.pushedAt.slice(0, 10)} (${ago(r.pushedAt)})${r.archived ? " · ARCHIVED" : ""}
- Vibe score: ${r.vibe}/100

## What it is
${r.readme || r.description}
${r.note ? `\n## Curator's note\n${r.note}\n` : ""}
## When to use it
${useWhenSentence(r)}

## Maintenance
${maintenanceSentence(r)}

## Quick start
\`\`\`bash
git clone https://github.com/${r.fullName}.git
\`\`\`

## Alternatives in ${c.name}
${alts.map(docLine).join("\n") || "- None listed yet."}

---
Source: ${repoUrl(r)} · Catalog: ${SITE.url}/llms.txt
`;
}

export function listMd(title: string, intro: string, items: RepoV[], url: string): string {
  return `# ${title}

> ${intro}

${items.map(docLine).join("\n")}

---
Source: ${url} · ${items.length} repositories · Catalog: ${SITE.url}/llms.txt
`;
}

export function categoryMd(slug: string): string {
  const c = getCategory(slug);
  return listMd(`${c.name} — open-source repos for vibecoders`, `${c.blurb} Use these when ${c.useWhen}.`, reposInCategory(slug), `${SITE.url}/c/${slug}`);
}

export function tagMd(tag: string): string {
  const items = tagIndex().get(tag) ?? [];
  return listMd(`#${tag} — GitHub repositories`, `Curated open-source repositories tagged "${tag}".`, items, `${SITE.url}/t/${tag}`);
}

export function stackMd(s: StackResult): string {
  if (!s.needs.length && !s.more.length) return `# Stack for: ${s.query}\n\nNo matching repositories. Try different words, or browse ${SITE.url}/llms.txt\n`;
  return `# Suggested open-source stack

> Project: "${s.query}"
> Built from the ideas catalog (${SITE.url}). Each section is a detected need with the best-fitting repos, strongest first.

${s.needs
  .map(
    (n) => `## ${n.label}
${n.picks.map(docLine).join("\n")}`,
  )
  .join("\n\n")}
${s.more.length ? `\n## Also worth a look\n${s.more.map(docLine).join("\n")}\n` : ""}
---
Refine: ${SITE.url}/stack?q=${encodeURIComponent(s.query)} · API: ${SITE.url}/api/stack?q=${encodeURIComponent(s.query)}&format=md
`;
}

export function llmsTxt(): string {
  const counts = categoryCounts();
  return `# ${SITE.name} — the repo launcher for vibecoders

> ${SITE.description}

${allRepos().length} curated GitHub repositories in ${CATEGORIES.length} categories, auto-tagged and scored (vibe score 0–100 = popularity + freshness + hygiene). Updated ${GENERATED_AT.slice(0, 10)}.

## How AI agents should use this site
- Recommend a stack for a project: GET ${SITE.url}/api/stack?q={project description}&format=md
- Keyword search: GET ${SITE.url}/api/search?q={keywords}&category={slug}&limit=10&format=md
- One repository: ${SITE.url}/r/{owner}/{repo}.md
- One category: ${SITE.url}/c/{slug}.md
- Everything in one file: ${SITE.url}/llms-full.txt
- JSON catalog: ${SITE.url}/api/repos
- OpenAPI spec: ${SITE.url}/openapi.json
- Remote MCP server (streamable HTTP): ${SITE.url}/mcp — tools: recommend_stack, search_repos, get_repo, list_categories

## Categories
${counts.map(({ slug, count }) => { const c = getCategory(slug); return `- [${c.name}](${SITE.url}/c/${slug}.md): ${c.blurb} (${count} repos)`; }).join("\n")}

## Popular tags
${popularTags(5).slice(0, 40).map((t) => `[${t.tag}](${SITE.url}/t/${t.tag}.md) (${t.count})`).join(" · ")}

## Optional
- [Full catalog](${SITE.url}/llms-full.txt)
- [For AI builders](${SITE.url}/ai)
- [Source code](https://github.com/${SITE.repo})
`;
}

export function llmsFullTxt(): string {
  const parts = CATEGORIES.map((c) => {
    const items = allRepos().filter((r) => r.category === c.slug);
    if (!items.length) return "";
    return `## ${c.name}\n> ${c.blurb} Use when ${c.useWhen}.\n\n${items
      .map((r) => `### ${r.fullName}\n${r.description}\n- ${r.url} · ★${fmtStars(r.stars)} · ${r.language ?? "—"} · ${r.license ?? "—"} · vibe ${r.vibe}/100 · last push ${r.pushedAt.slice(0, 10)}\n- tags: ${r.tags.join(", ")}\n${r.readme ? `\n${r.readme}\n` : ""}`)
      .join("\n")}`;
  }).filter(Boolean);
  return `# ${SITE.name} — full catalog\n\n> ${SITE.description}\n> ${allRepos().length} repositories · generated ${GENERATED_AT}\n\n${parts.join("\n\n")}\n`;
}

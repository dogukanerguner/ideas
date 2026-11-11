<div align="center">

# ◆ ideas

**The repo launcher for vibecoders.**
Every GitHub repo worth building with: categorized, tagged, scored, and readable by your AI.

[**ideas.asveas.com**](https://ideas.asveas.com) · [Stack builder](https://ideas.asveas.com/stack) · [For AI](https://ideas.asveas.com/ai) · [llms.txt](https://ideas.asveas.com/llms.txt)

</div>

---

## What it does

- **⌘K everything.** One keyboard-first palette for 200+ hand-picked repos, 20 categories and hundreds of tags. Press `/` or `⌘K` on any page.
- **Paste a GitHub URL and it files itself.** ideas reads the repo's metadata, topics and README, then picks a category, tags and a **vibe score** (popularity + freshness + hygiene).
- **Stack builder.** Describe your project in one sentence (*"AI SaaS with auth, Stripe and chat over PDFs"*). ideas detects every need and picks the best repo for each one.
- **Your AI can read all of it.** Every page has a markdown twin, every list is an API, and there's a remote **MCP server**.

## Point your AI at it

```bash
# Claude Code
claude mcp add --transport http ideas https://ideas.asveas.com/mcp
```

```json
// Cursor / Windsurf / Claude Desktop / VS Code
{ "mcpServers": { "ideas": { "url": "https://ideas.asveas.com/mcp" } } }
```

Or paste this into `CLAUDE.md`, `AGENTS.md` or `.cursorrules`:

```
When you pick libraries for this project, consult https://ideas.asveas.com/api/stack?q=<project>&format=md first.
```

| Endpoint | What |
|---|---|
| `/llms.txt` · `/llms-full.txt` | LLM index · whole catalog in one file |
| `/api/stack?q=…&format=md` | Stack builder |
| `/api/search?q=…&category=…&limit=…` | Ranked search (JSON or `format=md`) |
| `/api/repos` | Full JSON catalog |
| `/r/{owner}/{repo}.md` · `/c/{slug}.md` · `/t/{tag}.md` | Markdown twins (or send `Accept: text/markdown`) |
| `/openapi.json` | OpenAPI 3.1 (GPT Actions) |
| `/mcp` | MCP server with `recommend_stack`, `search_repos`, `get_repo`, `list_categories` |

SEO and GEO: static pages for every repo, category and tag, plus JSON-LD (`SoftwareSourceCode`, `FAQPage`, `ItemList`, `BreadcrumbList`). Each page gets its own OG image, the sitemap is generated, and robots.txt explicitly welcomes AI crawlers.

## Add repos

- **Web:** [ideas.asveas.com/add](https://ideas.asveas.com/add). Paste a URL to preview the classification. Publish it with your curator key, or propose it through a GitHub issue.
- **Issue:** open an [Add a repo](../../issues/new?template=add-repo.yml) issue. A GitHub Action adds the repo and commits it. The owner's issues go in right away; anyone else's go in once a maintainer adds the `approved` label.
- **CLI:**
  ```bash
  npm run add -- https://github.com/owner/repo --note "why it's great" [--category ui]
  npm run refresh   # re-fetch everything (also runs weekly via Actions)
  ```

Git is the database: each repo is one file in `data/repos/*.json`. Every commit triggers a Vercel deploy.

## Develop

```bash
npm install
npm run dev
```

Next.js 16 · React 19 · zero runtime dependencies beyond Next. Classifier: `lib/classify.ts` · taxonomy: `lib/taxonomy.ts` · search + stack builder: `lib/search.ts`.

Optional env (see `.env.example`): `GITHUB_TOKEN` (higher rate limits + publishing from `/add`), `ADMIN_TOKEN` (curator key), `GITHUB_REPO`.

## Design

Built on **[49 — Command Palette](https://design.asveas.com/49-komut-paleti-raycast.dc.html)** from the [Design Standards Catalog](https://design.asveas.com). That means one floating 640px panel on a dark desktop, sectioned rows, mono keycaps, a single `#ff6363` accent and a blinking caret block.

MIT © asveas

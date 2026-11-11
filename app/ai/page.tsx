import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/client";
import { AI_PROMPT, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "For AI agents — MCP server, llms.txt & JSON API",
  description: "Connect Claude, Cursor, ChatGPT or any agent to the ideas catalog: a remote MCP server, llms.txt, markdown twins of every page, a stack-builder API and an OpenAPI spec.",
  alternates: { canonical: "/ai" },
};

const U = SITE.url;
const BLOCKS: { title: string; sub: string; code: string }[] = [
  { title: "Claude Code", sub: "One command. Then ask: “use ideas to pick a stack for this repo”.", code: `claude mcp add --transport http ideas ${U}/mcp` },
  { title: "Cursor · Windsurf · Claude Desktop · VS Code", sub: "Add to your mcp.json / settings (remote streamable HTTP server).", code: `{\n  "mcpServers": {\n    "ideas": { "url": "${U}/mcp" }\n  }\n}` },
  { title: "Codex CLI", sub: "~/.codex/config.toml", code: `[mcp_servers.ideas]\nurl = "${U}/mcp"` },
  { title: "Agent rules (CLAUDE.md · AGENTS.md · .cursorrules)", sub: "Works with any agent that can fetch URLs — no MCP needed.", code: AI_PROMPT },
  { title: "ChatGPT · Perplexity · Gemini", sub: "Paste this into the chat.", code: `Fetch ${U}/api/stack?q=<describe my project>&format=md and recommend open-source repos from it for my project. Link each GitHub repo and say why it fits.` },
];

const ENDPOINTS: [string, string][] = [
  ["/llms.txt", "Index for LLMs: categories, tags, how to query"],
  ["/llms-full.txt", "The entire catalog as one markdown file"],
  ["/api/stack?q={project}&format=md", "Stack builder — detects needs, picks repos"],
  ["/api/search?q={kw}&category={slug}&limit=10", "Ranked search (JSON or format=md)"],
  ["/api/repos", "Full JSON catalog"],
  ["/r/{owner}/{repo}.md", "Markdown twin of any repo page"],
  ["/c/{slug}.md · /t/{tag}.md", "Markdown twin of category & tag pages"],
  ["/openapi.json", "OpenAPI 3.1 spec (GPT Actions, tool builders)"],
  ["/mcp", "Remote MCP server (JSON-RPC over streamable HTTP)"],
];

const TOOLS: [string, string][] = [
  ["recommend_stack", "project: string → best repos for every detected need"],
  ["search_repos", "query, category?, limit? → ranked repos"],
  ["get_repo", "repo: owner/name → full markdown profile + alternatives"],
  ["list_categories", "→ all categories with counts"],
];

export default function AiPage() {
  return (
    <main className="wrap wrap-wide">
      <nav className="crumbs"><Link href="/">ideas</Link> <span>/</span> <span>For AI</span></nav>
      <section className="panel">
        <div className="panel-head">
          <span className="ico ico-cmd">⌁</span>
          <div><h1>Plug ideas into your AI</h1><div className="sub">Built to be read by machines first. Every page has a markdown twin; every list is an API.</div></div>
        </div>
        <div className="panel-body">
          {BLOCKS.map((b) => (
            <div key={b.title} style={{ padding: "10px 10px 14px" }}>
              <h2 className="h">{b.title}</h2>
              <p className="muted" style={{ margin: "2px 0 8px", fontSize: 12.5 }}>{b.sub}</p>
              <div className="code code-wrap" style={{ paddingRight: 70 }}>{b.code}<CopyButton text={b.code} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack-gap">
        <div className="section-title" style={{ padding: "14px 18px 4px" }}><h2 className="h">MCP tools</h2><span className="mono" style={{ fontSize: 11 }}>{U.replace("https://", "")}/mcp</span></div>
        <div className="panel-body">
          {TOOLS.map(([n, d]) => (
            <div key={n} className="row" style={{ cursor: "default" }}>
              <span className="ico ico-cmd" style={{ fontSize: 11 }}>fn</span>
              <span className="row-main"><span className="row-name mono">{n}</span><span className="row-sub">{d}</span></span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack-gap">
        <div className="section-title" style={{ padding: "14px 18px 4px" }}><h2 className="h">Endpoints</h2><span>CORS open · no key</span></div>
        <div className="panel-body">
          {ENDPOINTS.map(([p, d]) => {
            const href = p.replace("{project}", "ai+saas+with+payments").replace("{kw}", "vector").replace("&category={slug}", "").replace("{owner}/{repo}", "vercel/next.js").split(" ")[0];
            return (
              <a key={p} href={href} className="row">
                <span className="ico ico-cmd" style={{ fontSize: 10 }}>GET</span>
                <span className="row-main row-stack"><span className="row-name mono" style={{ fontSize: 12.5, whiteSpace: "normal", wordBreak: "break-all" }}>{p}</span><span className="row-sub">{d}</span></span>
                <span className="row-right"><span className="kbd">↵</span></span>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}

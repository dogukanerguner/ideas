/* Minimal stateless MCP server over Streamable HTTP (JSON responses, no sessions).
   claude mcp add --transport http ideas https://ideas.asveas.com/mcp */
import { allDocs, categoryCounts, getRepo } from "@/lib/data";
import { docLine, repoMd, stackMd } from "@/lib/md";
import { buildStack, searchDocs } from "@/lib/search";
import { SITE } from "@/lib/site";
import { CATEGORY_MAP, getCategory } from "@/lib/taxonomy";

type Rpc = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];
const CATS = Object.keys(CATEGORY_MAP);

const TOOLS = [
  {
    name: "recommend_stack",
    title: "Recommend an open-source stack",
    description: "Describe a software project in one or two sentences; returns the best-fitting open-source GitHub repos for every need detected (frontend, UI, auth, payments, database, LLM, agents, RAG, deploy, analytics…). Use this before choosing libraries for a new project or feature.",
    inputSchema: { type: "object", properties: { project: { type: "string", description: "What you're building, e.g. 'AI SaaS with auth, Stripe and chat over PDFs'" } }, required: ["project"] },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "search_repos",
    title: "Search repos",
    description: "Keyword search over the curated ideas catalog of GitHub repositories. Returns ranked repos with stars, language, category and a link to a full profile.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords, e.g. 'vector database', 'react animation', 'tui go'" },
        category: { type: "string", enum: CATS, description: "Optional category filter" },
        limit: { type: "number", minimum: 1, maximum: 30, default: 10 },
      },
      required: ["query"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_repo",
    title: "Get repo profile",
    description: "Full profile of one repository: what it is, when to use it, maintenance status, license, tags and alternatives.",
    inputSchema: { type: "object", properties: { repo: { type: "string", description: "owner/name, e.g. 'shadcn-ui/ui'" } }, required: ["repo"] },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "list_categories",
    title: "List categories",
    description: "All catalog categories with descriptions and repo counts.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

function callTool(name: string, args: Record<string, unknown>): { text: string; isError?: boolean } {
  switch (name) {
    case "recommend_stack": {
      const p = String(args.project ?? args.query ?? "").slice(0, 400);
      if (!p) return { text: "Missing 'project'.", isError: true };
      return { text: stackMd(buildStack(allDocs(), p)) };
    }
    case "search_repos": {
      const q = String(args.query ?? "").slice(0, 300);
      const category = typeof args.category === "string" && CATEGORY_MAP[args.category] ? args.category : undefined;
      const limit = Math.min(30, Math.max(1, Number(args.limit) || 10));
      const hits = searchDocs(allDocs(), q, { category, limit });
      return { text: hits.length ? `# Results for "${q}"\n\n${hits.map((h) => docLine(h.doc)).join("\n")}` : `No repos matched "${q}". Try broader keywords or recommend_stack.` };
    }
    case "get_repo": {
      const [o, n] = String(args.repo ?? "").replace(/^https?:\/\/github\.com\//, "").split("/");
      const r = o && n ? getRepo(o, n) : undefined;
      return r ? { text: repoMd(r) } : { text: `Repo "${args.repo}" is not in the catalog. Search with search_repos, or add it at ${SITE.url}/add`, isError: true };
    }
    case "list_categories":
      return { text: categoryCounts().filter((c) => c.count).map(({ slug, count }) => { const c = getCategory(slug); return `- **${c.name}** (\`${slug}\`, ${count} repos): ${c.blurb}`; }).join("\n") };
    default:
      return { text: `Unknown tool: ${name}`, isError: true };
  }
}

function handle(msg: Rpc): object | null {
  const { id, method, params = {} } = msg;
  if (id === undefined || id === null) return null; // notification
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  switch (method) {
    case "initialize": {
      const v = String(params.protocolVersion ?? "");
      return ok({
        protocolVersion: SUPPORTED.includes(v) ? v : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "ideas", title: "ideas — repo launcher for vibecoders", version: "1.0.0", websiteUrl: SITE.url },
        instructions: "Use recommend_stack when the user describes a project or feature; use search_repos for specific needs; use get_repo for details and alternatives. Always cite GitHub URLs.",
      });
    }
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call": {
      const r = callTool(String(params.name), (params.arguments as Record<string, unknown>) ?? {});
      return ok({ content: [{ type: "text", text: r.text }], isError: r.isError ?? false });
    }
    case "resources/list":
      return ok({ resources: [] });
    case "prompts/list":
      return ok({ prompts: [] });
    default:
      return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Expose-Headers": "Mcp-Session-Id" };

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers: CORS });
  }
  const msgs = Array.isArray(body) ? body : [body];
  const out = msgs.map((m) => handle(m as Rpc)).filter(Boolean);
  if (!out.length) return new Response(null, { status: 202, headers: CORS });
  return Response.json(Array.isArray(body) ? out : out[0], { headers: CORS });
}

export function GET() {
  return new Response(
    `ideas MCP server — POST JSON-RPC here (Streamable HTTP).\n\nClaude Code:  claude mcp add --transport http ideas ${SITE.url}/mcp\nTools: ${TOOLS.map((t) => t.name).join(", ")}\n`,
    { status: 405, headers: { ...CORS, Allow: "POST", "Content-Type": "text/plain; charset=utf-8" } },
  );
}

export function DELETE() {
  return new Response(null, { status: 405, headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS" } });
}

/* Pure, isomorphic search — runs on the server (API, MCP, /stack) and in the browser (⌘K palette). */
import type { Doc } from "./types.ts";

const STOP = new Set(
  "a an and are as at be build building by can for from get have how i im i'm in into is it its like make me my need of on or our project some something that the this to tool tools use using want we what which with without you your app apps repo repos library libraries best good simple open source want needs".split(" "),
);

const SYN: Record<string, string[]> = {
  auth: ["authentication", "login", "oauth", "sso"],
  login: ["auth", "authentication"],
  signin: ["auth"],
  payment: ["payments", "billing", "stripe"],
  payments: ["billing", "stripe", "subscriptions"],
  billing: ["payments", "subscriptions"],
  db: ["database", "postgres", "sql"],
  database: ["db", "postgres", "orm"],
  ai: ["llm", "ai-agents", "openai", "claude"],
  llm: ["ai", "openai", "claude", "ollama"],
  gpt: ["openai", "llm"],
  chat: ["chatbot", "chat-ui", "llm"],
  chatbot: ["chat", "llm"],
  agent: ["ai-agents", "agents", "agentic"],
  agents: ["ai-agents", "agentic"],
  ui: ["components", "design-system", "react"],
  components: ["ui", "design-system"],
  vector: ["vector-db", "vector-database", "vector-search", "embeddings", "rag"],
  embeddings: ["vector-db", "rag"],
  search: ["semantic-search", "search-engine", "full-text-search"],
  scrape: ["scraping", "crawler", "scraper"],
  scraping: ["crawler", "scraper"],
  crawl: ["crawler", "scraping"],
  deploy: ["deployment", "paas", "hosting", "docker"],
  hosting: ["deploy", "paas"],
  analytics: ["product-analytics", "web-analytics"],
  email: ["emails", "newsletter", "notifications"],
  mobile: ["react-native", "ios", "android", "expo"],
  desktop: ["electron", "tauri"],
  cli: ["terminal", "command-line", "tui"],
  terminal: ["cli", "tui", "shell"],
  test: ["testing", "e2e"],
  tests: ["testing", "e2e"],
  workflow: ["automation", "workflows"],
  automation: ["workflow", "no-code"],
  cms: ["headless-cms", "content"],
  image: ["image-generation", "stable-diffusion"],
  voice: ["tts", "speech", "audio"],
  video: ["ffmpeg", "video-generation"],
  local: ["self-hosted", "local-first", "ollama"],
  selfhosted: ["self-hosted"],
  nextjs: ["next", "react"],
  next: ["nextjs"],
  python: ["py"],
  realtime: ["websocket", "websockets"],
  form: ["forms", "react-hook-form"],
  forms: ["form", "validation"],
  icons: ["icon"],
  chart: ["charts", "charting"],
  charts: ["chart", "charting", "data-visualization"],
  editor: ["rich-text-editor", "code-editor"],
  mcp: ["model-context-protocol", "mcp-server"],
  rag: ["retrieval", "vector-db", "embeddings"],
};

export function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/next\.js/g, "nextjs")
    .replace(/node\.js/g, "node")
    .split(/[^\p{L}\p{N}+#-]+/u)
    .map((t) => t.replace(/^-+|-+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function stem(t: string): string {
  return t.length > 4 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t;
}

type Prepared = Doc & { _name: string; _full: string; _desc: string; _tags: Set<string>; _tagStr: string };
const prepCache = new WeakMap<Doc, Prepared>();
function prep(d: Doc): Prepared {
  let p = prepCache.get(d);
  if (!p) {
    const tags = new Set([...d.tags, ...d.topics].map((t) => t.toLowerCase()));
    p = {
      ...d,
      _name: d.name.toLowerCase(),
      _full: d.fullName.toLowerCase(),
      _desc: ` ${d.description.toLowerCase().replace(/[^\p{L}\p{N}+#.-]+/gu, " ")} `,
      _tags: tags,
      _tagStr: ` ${[...tags].join(" ")} `,
    };
    prepCache.set(d, p);
  }
  return p;
}

function termScore(p: Prepared, t: string, isLast: boolean): number {
  const s = stem(t);
  let sc = 0;
  if (p._name === t || p._name === s) sc += 12;
  else if (p._name.startsWith(t)) sc += 7;
  else if (p._name.includes(t) && t.length > 2) sc += 4;
  else if (p._full.includes(t) && t.length > 2) sc += 2;
  if (p._tags.has(t) || p._tags.has(s) || p._tags.has(`${t}s`)) sc += 5;
  else if (isLast && t.length > 1 && p._tagStr.includes(` ${t}`)) sc += 2.5;
  if (p.category === t || p.category === s) sc += 4;
  else if (p.categories.includes(t)) sc += 2;
  if (p._desc.includes(` ${t} `) || p._desc.includes(` ${s} `) || p._desc.includes(` ${t}s `) || p._desc.includes(` ${t}es `)) sc += 3;
  else if (t.length > 3 && p._desc.includes(s)) sc += 1.2;
  else if (isLast && t.length > 1 && p._desc.includes(` ${t}`)) sc += 1;
  if (p.language && p.language.toLowerCase() === t) sc += 3;
  return sc;
}

export type Hit = { doc: Doc; score: number };

export function searchDocs(docs: Doc[], query: string, opts: { limit?: number; category?: string; boost?: string[] } = {}): Hit[] {
  const tokens = tokenize(query);
  const boost = (opts.boost ?? []).flatMap(tokenize);
  if (!tokens.length && !boost.length) {
    return docs
      .filter((d) => !opts.category || d.categories.includes(opts.category))
      .sort((a, b) => b.vibe - a.vibe)
      .slice(0, opts.limit ?? 20)
      .map((doc) => ({ doc, score: doc.vibe / 100 }));
  }
  const hits: Hit[] = [];
  for (const d of docs) {
    if (opts.category && !d.categories.includes(opts.category)) continue;
    const p = prep(d);
    let score = 0;
    let matched = 0;
    tokens.forEach((t, i) => {
      const s = termScore(p, t, i === tokens.length - 1);
      if (s > 0) matched++;
      score += s;
      for (const syn of SYN[t] ?? []) score += termScore(p, syn, false) * 0.45;
    });
    for (const b of boost) score += termScore(p, b, false) * 0.8;
    if (score <= 0) continue;
    // reward documents that match more of the distinct query terms
    if (tokens.length > 1) {
      const cov = matched / tokens.length;
      score *= 0.25 + 0.75 * cov * cov;
      const phrase = tokens.join(" ");
      if (p._desc.includes(` ${phrase}`) || p._tags.has(tokens.join("-")) || p._name.includes(tokens.join("-"))) score += 14;
    }
    score *= 0.7 + (d.vibe / 100) * 0.6;
    if (opts.category && d.category === opts.category) score *= 1.3;
    hits.push({ doc: d, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, opts.limit ?? 20);
}

/* ------------------------------ stack builder ------------------------------ */

export type Need = { id: string; label: string; category: string; re: RegExp; terms: string };

export const NEEDS: Need[] = [
  { id: "starter", label: "Starter / boilerplate", category: "starters", re: /\b(saas|boilerplate|starter|mvp|side ?project|startup|template)\b/i, terms: "saas starter boilerplate nextjs" },
  { id: "frontend", label: "Frontend framework", category: "frontend", re: /\b(web ?apps?|website|landing( page)?|frontend|next\.?js|react|vue|svelte|astro|site|blog|saas|dashboard|spa)\b/i, terms: "react nextjs framework" },
  { id: "ui", label: "UI components", category: "ui", re: /\b(ui|ux|dashboard|components?|design|landing|beautiful|pretty|animations?|charts?|icons?|tailwind)\b/i, terms: "components react tailwind" },
  { id: "editor", label: "Editor / canvas", category: "ui", re: /\b(whiteboard|canvas|diagram|rich ?text|notion|wysiwyg|flowchart|editor)\b/i, terms: "editor canvas whiteboard rich-text" },
  { id: "backend", label: "Backend & API", category: "backend", re: /\b(api|backend|server|rest|graphql|webhooks?|cron|queue|jobs?)\b/i, terms: "api typescript server" },
  { id: "realtime", label: "Realtime", category: "backend", re: /\b(realtime|real-time|websockets?|multiplayer|live|collaborat\w*)\b/i, terms: "realtime websocket" },
  { id: "database", label: "Database / ORM", category: "database", re: /\b(database|db|postgres\w*|sql|sqlite|mysql|orm|crud|store data|persist\w*)\b/i, terms: "postgres orm typescript" },
  { id: "auth", label: "Authentication", category: "auth-payments", re: /\b(auth\w*|log ?in|sign ?(in|up)|users?|accounts?|oauth|sso|passkeys?|members?)\b/i, terms: "authentication auth oauth login" },
  { id: "payments", label: "Payments & billing", category: "auth-payments", re: /\b(payments?|pay|stripe|billing|subscriptions?|checkout|monetiz\w*|pricing|paid)\b/i, terms: "payments billing stripe subscriptions" },
  { id: "llm", label: "LLM / AI model", category: "llm", re: /\b(ai|llms?|gpt\w*|claude|chat ?bots?|ai chat|chat (with|over) \w+|openai|anthropic|gemini|models?|prompts?|summari\w+|generat\w+ text|copilot)\b/i, terms: "llm sdk typescript openai claude" },
  { id: "local-llm", label: "Local / private AI", category: "llm", re: /\b(local( ai| llm| model)?s?|offline|on-?device|private ai|self-?hosted ai|ollama)\b/i, terms: "local llm ollama self-hosted" },
  { id: "agents", label: "AI agents", category: "ai-agents", re: /\b(agents?|agentic|autonomous|multi-?agent|assistants?|tool ?calling|function calling)\b/i, terms: "agent framework typescript python" },
  { id: "rag", label: "RAG / vector search", category: "rag", re: /\b(rag|vectors?|embeddings?|semantic|search|knowledge ?base|docs? (q&a|qa|chat)|pdfs?|documents?|memory)\b/i, terms: "vector-db rag semantic search" },
  { id: "scraping", label: "Scraping & crawling", category: "rag", re: /\b(scrap\w*|crawl\w*|extract\w*|web data|parse websites?)\b/i, terms: "crawler scraping llm-ready" },
  { id: "mcp", label: "MCP / tools for AI", category: "mcp", re: /\b(mcp|model context protocol|tools? for (claude|ai|llms?)|cursor tools?)\b/i, terms: "mcp server" },
  { id: "media", label: "Image / audio / video", category: "genmedia", re: /\b(images?|photos?|videos?|audio|voice|speech|tts|transcri\w+|music|podcasts?|avatar)\b/i, terms: "image video audio generation" },
  { id: "mobile", label: "Mobile app", category: "mobile-desktop", re: /\b(mobile|ios|android|iphone|app store|react native|expo|flutter)\b/i, terms: "mobile react-native ios android" },
  { id: "desktop", label: "Desktop app", category: "mobile-desktop", re: /\b(desktop|mac ?os app|mac app|windows app|electron|tauri|menubar)\b/i, terms: "desktop electron tauri" },
  { id: "deploy", label: "Deploy & hosting", category: "devops", re: /\b(deploy\w*|hosting|host it|docker|kubernetes|vps|production|ship it|self-?host\w*)\b/i, terms: "deploy paas docker self-hosted" },
  { id: "analytics", label: "Analytics & monitoring", category: "selfhost", re: /\b(analytics|metrics|tracking|monitor\w*|observability|errors?|uptime|logs?)\b/i, terms: "analytics monitoring error-tracking" },
  { id: "cms", label: "CMS / content", category: "selfhost", re: /\b(cms|blog|content|marketing site|articles?)\b/i, terms: "cms headless-cms content" },
  { id: "email", label: "Email & notifications", category: "selfhost", re: /\b(e-?mails?|newsletters?|notifications?|push)\b/i, terms: "email notifications" },
  { id: "scheduling", label: "Scheduling", category: "selfhost", re: /\b(booking|schedul\w+|calendar|appointments?)\b/i, terms: "scheduling calendar" },
  { id: "automation", label: "Automation & workflows", category: "automation", re: /\b(automat\w+|workflows?|zapier|no-?code|low-?code|internal tools?|admin panel|integrations?)\b/i, terms: "workflow automation" },
  { id: "testing", label: "Testing", category: "testing", re: /\b(tests?|testing|e2e|qa|lint\w*|quality)\b/i, terms: "testing e2e" },
  { id: "cli", label: "CLI / terminal", category: "cli", re: /\b(cli|terminal|command ?line|shell|tui)\b/i, terms: "cli terminal tui" },
  { id: "coding", label: "AI coding assistant", category: "ai-coding", re: /\b(vibe ?cod\w*|coding|code faster|ai pair|copilot|cursor|claude code|write code)\b/i, terms: "coding agent terminal" },
  { id: "learning", label: "Learn the stack", category: "learning", re: /\b(learn\w*|tutorials?|courses?|roadmaps?|beginners?|study|interview|prompt engineering)\b/i, terms: "learning guide awesome-list" },
];

export type StackResult = {
  query: string;
  needs: { id: string; label: string; category: string; picks: Doc[] }[];
  more: Doc[];
};

export function buildStack(docs: Doc[], query: string, perNeed = 3): StackResult {
  const q = query.trim();
  const matched = NEEDS.filter((n) => n.re.test(q));
  // "saas" alone would trigger many needs; collapse duplicates by category+id order
  const used = new Set<string>();
  const needs = matched.map((n) => {
    const hits = searchDocs(docs, q, { category: n.category, boost: [n.terms], limit: perNeed * 3 });
    const picks: Doc[] = [];
    for (const h of hits) {
      if (picks.length >= perNeed) break;
      if (used.has(h.doc.id) && hits.length > perNeed) continue;
      picks.push(h.doc);
    }
    picks.slice(0, 1).forEach((d) => used.add(d.id));
    return { id: n.id, label: n.label, category: n.category, picks };
  }).filter((n) => n.picks.length);
  for (const n of needs) for (const d of n.picks) used.add(d.id);
  const all = searchDocs(docs, q, { limit: 20 });
  const floor = (all[0]?.score ?? 0) * 0.35;
  const more = all
    .filter((h) => h.score >= floor)
    .map((h) => h.doc)
    .filter((d) => !used.has(d.id))
    .slice(0, 8);
  return { query: q, needs, more };
}

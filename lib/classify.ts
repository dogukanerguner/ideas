import { CATEGORIES } from "./taxonomy.ts";

/** lowercase, unify separators so "next-js", "next_js" and "next js" match the same keyword */
export function norm(s: string): string {
  return ` ${s.toLowerCase().replace(/[_\-]+/g, " ").replace(/[^\p{L}\p{N}.+#/ ]+/gu, " ").replace(/\s+/g, " ").trim()} `;
}

const reCache = new Map<string, RegExp>();
function kwRe(kw: string): RegExp {
  let re = reCache.get(kw);
  if (!re) {
    const k = norm(kw).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${k}(?:[^\\p{L}\\p{N}]|$)`, "u");
    reCache.set(kw, re);
  }
  return re;
}

export type ClassifyInput = {
  name: string;
  description: string;
  topics: string[];
  language: string | null;
  readme: string;
};

const FIELD_WEIGHTS = { topics: 3.5, name: 2.5, description: 2.5, readme: 0.6 } as const;

export function scoreCategories(input: ClassifyInput): Record<string, number> {
  const fields = {
    topics: norm(input.topics.join(" | ")),
    name: norm(input.name),
    description: norm(input.description),
    readme: norm(input.readme.slice(0, 5000)),
  };
  const scores: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    let s = 0;
    for (const [kw, w] of Object.entries(cat.keywords)) {
      const re = kwRe(kw);
      for (const f of Object.keys(FIELD_WEIGHTS) as (keyof typeof FIELD_WEIGHTS)[]) {
        if (re.test(fields[f])) s += w * FIELD_WEIGHTS[f];
      }
    }
    scores[cat.slug] = Math.round(s * 10) / 10;
  }
  if (/^awesome/i.test(input.name)) scores.learning += 40;
  if (/(boilerplate|starter|template)/i.test(input.name)) scores.starters += 30;
  return scores;
}

export function classify(input: ClassifyInput): { category: string; categories: string[]; scores: Record<string, number> } {
  const scores = scoreCategories(input);
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topSlug, topScore] = ranked[0];
  if (topScore < 4) return { category: "devtools", categories: ["devtools"], scores };
  const categories = ranked
    .filter(([, s], i) => i === 0 || (s >= topScore * 0.55 && s >= 8))
    .slice(0, 3)
    .map(([slug]) => slug);
  return { category: topSlug, categories, scores };
}

/* ---------------------------------- tags ---------------------------------- */

const TAG_SYNONYMS: Record<string, string> = {
  "next.js": "nextjs", "next js": "nextjs", next: "nextjs", reactjs: "react", "react js": "react",
  vuejs: "vue", vue3: "vue", "vue js": "vue", sveltejs: "svelte", golang: "go", llms: "llm",
  "large language models": "llm", "large language model": "llm", agent: "ai-agents", agents: "ai-agents",
  "ai agent": "ai-agents", "ai agents": "ai-agents", "llm agent": "ai-agents", "llm agents": "ai-agents",
  postgresql: "postgres", "self hosted": "self-hosted", selfhosted: "self-hosted", "self host": "self-hosted",
  "artificial intelligence": "ai", "machine learning": "machine-learning", ml: "machine-learning",
  "deep learning": "deep-learning", "model context protocol": "mcp", "mcp server": "mcp", "mcp servers": "mcp",
  tailwindcss: "tailwind", "tailwind css": "tailwind", "chat gpt": "chatgpt", "open ai": "openai",
  "vector database": "vector-db", "vector db": "vector-db", "vector search": "vector-db",
  "retrieval augmented generation": "rag", "text to speech": "tts", "speech to text": "stt",
  "stable diffusion": "stable-diffusion", "react native": "react-native", "command line": "cli",
  "command line tool": "cli", "terminal ui": "tui", "no code": "no-code", nocode: "no-code",
  "low code": "low-code", lowcode: "low-code", "headless cms": "cms", "web scraping": "scraping",
  "web crawler": "crawler", "end to end testing": "e2e", "e2e testing": "e2e", javascript: "javascript",
  js: "javascript", ts: "typescript", py: "python", "nodejs": "node", "node js": "node", "node.js": "node",
  "open source": "", opensource: "", "open-source": "", hacktoberfest: "", github: "", "hacktoberfest2021": "",
  "hacktoberfest2022": "", "hacktoberfest2023": "", awesome: "awesome-list", "awesome list": "awesome-list",
  lists: "", list: "", "good first issue": "", "first timers": "", "beginner friendly": "",
};

/** Detected from name + description + topics, regardless of the repo's own topics. */
const TAG_RULES: Record<string, string[]> = {
  react: ["react", "jsx"],
  nextjs: ["next.js", "nextjs"],
  vue: ["vue", "vue.js", "nuxt"],
  svelte: ["svelte", "sveltekit"],
  tailwind: ["tailwind", "tailwindcss"],
  typescript: ["typescript", "type safe", "typesafe"],
  python: ["python"],
  rust: ["rust", "written in rust"],
  go: ["golang", "written in go"],
  docker: ["docker", "docker compose", "container"],
  postgres: ["postgres", "postgresql"],
  sqlite: ["sqlite"],
  "self-hosted": ["self hosted", "selfhosted", "self host", "self hostable"],
  openai: ["openai", "chatgpt", "gpt 4", "gpt 5"],
  claude: ["claude", "anthropic"],
  ollama: ["ollama"],
  llm: ["llm", "llms", "large language model", "language model"],
  "ai-agents": ["ai agent", "ai agents", "agentic", "multi agent", "autonomous agent"],
  mcp: ["mcp", "model context protocol"],
  rag: ["rag", "retrieval augmented"],
  "vector-db": ["vector database", "vector search", "vector db", "embeddings"],
  cli: ["cli", "command line"],
  tui: ["tui", "terminal ui", "terminal user interface"],
  stripe: ["stripe"],
  payments: ["payments", "billing", "subscriptions"],
  auth: ["auth", "authentication", "oauth", "sso", "login"],
  "open-source-alternative": ["open source alternative", "alternative to"],
  "no-code": ["no code", "nocode"],
  "low-code": ["low code", "lowcode"],
  scraping: ["scraping", "scraper", "web crawler", "crawler"],
  pdf: ["pdf"],
  realtime: ["realtime", "real time"],
  serverless: ["serverless", "edge"],
  analytics: ["analytics"],
  cms: ["cms"],
  email: ["email"],
  "local-first": ["local first", "offline first"],
  privacy: ["privacy"],
  "browser-automation": ["browser automation", "headless browser", "headless chrome"],
  mobile: ["mobile", "ios", "android"],
  desktop: ["desktop"],
  "design-system": ["design system"],
  animation: ["animation", "animations"],
  icons: ["icons"],
  charts: ["charts", "charting", "data visualization"],
  "code-editor": ["code editor"],
  "vibe-coding": ["vibe coding", "vibe code", "vibecoding"],
  "prompt-engineering": ["prompt engineering", "prompts"],
  workflow: ["workflow", "workflows"],
  monorepo: ["monorepo"],
  wasm: ["webassembly", "wasm"],
  "3d": ["3d", "webgl", "three.js"],
};

export function normalizeTag(raw: string): string {
  const n = norm(raw).trim();
  const mapped = (n in TAG_SYNONYMS ? TAG_SYNONYMS[n] : n).replace(/c\+\+/g, "cpp").replace(/c#/g, "csharp").replace(/f#/g, "fsharp");
  return mapped.replace(/[\s.+#/]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

export function extractTags(input: ClassifyInput): string[] {
  const out: string[] = [];
  const push = (t: string) => {
    if (t && t.length > 1 && t.length <= 32 && !out.includes(t)) out.push(t);
  };
  for (const t of input.topics) push(normalizeTag(t));
  const hay = norm(`${input.name} ${input.description} ${input.topics.join(" ")}`);
  for (const [tag, pats] of Object.entries(TAG_RULES)) {
    if (pats.some((p) => kwRe(p).test(hay))) push(tag);
  }
  if (input.language) push(normalizeTag(input.language));
  return out.slice(0, 14);
}

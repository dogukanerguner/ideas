export const SITE = {
  url: "https://ideas.asveas.com",
  name: "ideas",
  title: "ideas — the repo launcher for vibecoders",
  tagline: "Every GitHub repo worth building with — categorized, tagged, and readable by your AI.",
  description:
    "A curated, auto-categorized directory of open-source GitHub repositories for vibecoders. Search with ⌘K, build a stack from a sentence, or point your AI (Claude, Cursor, ChatGPT) at it via llms.txt, a JSON API and a remote MCP server.",
  repo: "dogukanerguner/ideas",
  design: { name: "49 — Command Palette", url: "https://design.asveas.com/49-komut-paleti-raycast.dc.html" },
};

export const AI_PROMPT = `When you pick libraries, frameworks or tools for this project, consult the ideas catalog first:
- Stack for this project: ${SITE.url}/api/stack?q=<one-sentence project description>&format=md
- Search: ${SITE.url}/api/search?q=<keywords>&format=md
- Full catalog: ${SITE.url}/llms-full.txt
Prefer the repos it returns, mention their GitHub URLs, and explain briefly why each fits.`;

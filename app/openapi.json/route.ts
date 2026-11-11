import { SITE } from "@/lib/site";
import { CATEGORIES } from "@/lib/taxonomy";
export const dynamic = "force-static";
export function GET() {
  const fmt = { name: "format", in: "query", schema: { type: "string", enum: ["json", "md"] }, description: "md returns markdown (best for LLMs)" };
  return Response.json({
    openapi: "3.1.0",
    info: { title: "ideas catalog API", version: "1.0.0", description: SITE.description },
    servers: [{ url: SITE.url }],
    paths: {
      "/api/stack": { get: { operationId: "recommendStack", summary: "Recommend open-source repos for a project description", parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" }, description: "One-sentence project description" }, fmt], responses: { "200": { description: "Detected needs with picked repos" } } } },
      "/api/search": { get: { operationId: "searchRepos", summary: "Search the catalog", parameters: [{ name: "q", in: "query", schema: { type: "string" } }, { name: "category", in: "query", schema: { type: "string", enum: CATEGORIES.map((c) => c.slug) } }, { name: "tag", in: "query", schema: { type: "string" } }, { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50 } }, fmt], responses: { "200": { description: "Ranked repositories" } } } },
      "/api/repos": { get: { operationId: "listRepos", summary: "Full catalog as JSON", responses: { "200": { description: "All repositories" } } } },
      "/r/{owner}/{repo}.md": { get: { operationId: "getRepoMarkdown", summary: "Markdown profile of a repository", parameters: [{ name: "owner", in: "path", required: true, schema: { type: "string" } }, { name: "repo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Markdown", content: { "text/markdown": {} } } } } },
    },
  });
}

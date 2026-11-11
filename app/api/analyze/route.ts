import { getRepo } from "@/lib/data";
import { classify } from "@/lib/classify";
import { fetchRepoRecord, parseRepoInput, RepoFetchError } from "@/lib/github";
import { json } from "@/lib/http";

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url") ?? "";
  const p = parseRepoInput(url);
  if (!p) return json({ error: "Paste a GitHub repo URL like https://github.com/owner/repo" }, 400, false);
  const existing = getRepo(p.owner, p.name) ?? null;
  try {
    const repo = await fetchRepoRecord(url, { token: process.env.GITHUB_TOKEN, existing });
    const { scores } = classify({ name: repo.name, description: repo.description, topics: repo.topics, language: repo.language, readme: repo.readme });
    return json({ repo, exists: Boolean(existing), scores }, 200, false);
  } catch (e) {
    const status = e instanceof RepoFetchError ? e.status : 500;
    return json({ error: status === 403 || status === 429 ? "GitHub rate limit hit — try again in a minute." : (e as Error).message }, status === 403 ? 429 : status, false);
  }
}

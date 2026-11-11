import { timingSafeEqual } from "node:crypto";
import { getRepo } from "@/lib/data";
import { fetchRepoRecord, parseRepoInput, repoFileName, RepoFetchError } from "@/lib/github";
import { json } from "@/lib/http";
import { SITE } from "@/lib/site";
import { CATEGORY_MAP } from "@/lib/taxonomy";

function authorized(req: Request): boolean {
  const want = process.env.ADMIN_TOKEN;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!want || !got) return false;
  const a = Buffer.from(want), b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Commits data/repos/<owner>__<name>.json to the catalog repo → Vercel redeploys. */
export async function POST(req: Request) {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !process.env.ADMIN_TOKEN) return json({ error: "Publishing is not configured on this deployment (GITHUB_TOKEN / ADMIN_TOKEN)." }, 501, false);
  if (!authorized(req)) return json({ error: "Wrong curator key." }, 401, false);
  const body = (await req.json().catch(() => ({}))) as { url?: string; category?: string; note?: string };
  const p = parseRepoInput(body.url ?? "");
  if (!p) return json({ error: "Invalid repo URL" }, 400, false);
  const category = body.category && CATEGORY_MAP[body.category] ? body.category : undefined;
  const existing = getRepo(p.owner, p.name) ?? null;
  try {
    const rec = await fetchRepoRecord(body.url!, { token, existing, note: body.note?.trim().slice(0, 280) || undefined });
    if (category && category !== rec.category) {
      rec.category = category;
      rec.categories = [category, ...rec.categories.filter((c) => c !== category)].slice(0, 3);
      rec.manualCategory = true;
    }
    const repo = process.env.GITHUB_REPO ?? SITE.repo;
    const path = `data/repos/${repoFileName(rec.fullName)}`;
    const api = `https://api.github.com/repos/${repo}/contents/${path}`;
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "ideas-portal", "X-GitHub-Api-Version": "2022-11-28" };
    const cur = await fetch(api, { headers });
    const sha = cur.ok ? ((await cur.json()) as { sha: string }).sha : undefined;
    const put = await fetch(api, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `${sha ? "update" : "add"}: ${rec.fullName} → ${rec.category}`,
        content: Buffer.from(JSON.stringify(rec, null, 2) + "\n").toString("base64"),
        ...(sha ? { sha } : {}),
      }),
    });
    if (!put.ok) return json({ error: `GitHub commit failed (${put.status}): ${(await put.text()).slice(0, 200)}` }, 502, false);
    const j = (await put.json()) as { commit?: { html_url?: string } };
    return json({ ok: true, path, repo: rec, commit: j.commit?.html_url }, 200, false);
  } catch (e) {
    return json({ error: (e as Error).message }, e instanceof RepoFetchError ? e.status : 500, false);
  }
}

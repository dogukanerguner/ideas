import { getRepo } from "@/lib/data";
import { fetchRepoRecord, parseRepoInput, RepoFetchError } from "@/lib/github";
import { json } from "@/lib/http";
import { createProposal, findOpenProposal, HOURLY_LIMIT, proposalsLastHour, qualityGate } from "@/lib/proposals";
import { CATEGORY_MAP } from "@/lib/taxonomy";

/* Public: anyone can propose a repo, no account needed. The proposal becomes a GitHub issue (durable),
   and is published automatically when it meets the quality bar, otherwise it waits for review. */
const recent = new Map<string, number[]>(); // best-effort per-instance throttle on top of the global hourly cap

export async function POST(req: Request) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return json({ error: "Proposals are not configured on this deployment." }, 501, false);
  const body = (await req.json().catch(() => ({}))) as { url?: string; category?: string; note?: string; website?: string };
  if (body.website) return json({ ok: true, state: "pending" }, 200, false); // honeypot: bots fill every field

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  const now = Date.now();
  const mine = (recent.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (mine.length >= 8) return json({ error: "Too many proposals from you in the last hour. Try again later." }, 429, false);

  const p = parseRepoInput(body.url ?? "");
  if (!p) return json({ error: "That doesn't look like a GitHub repository URL." }, 400, false);
  const listed = getRepo(p.owner, p.name);
  if (listed) return json({ ok: true, state: "live", repo: listed.fullName, page: `/r/${listed.owner}/${listed.name}` }, 200, false);

  try {
    const rec = await fetchRepoRecord(body.url!, { token });
    const again = getRepo(rec.owner, rec.name); // renamed repos resolve to their canonical name
    if (again) return json({ ok: true, state: "live", repo: again.fullName, page: `/r/${again.owner}/${again.name}` }, 200, false);
    const open = await findOpenProposal(token, rec.fullName);
    if (open) return json({ ok: true, state: open.labels.some((l) => l.name === "pending") ? "pending" : "publishing", repo: rec.fullName, issue: open.number, track: `/add/status/${open.number}`, duplicate: true }, 200, false);
    if ((await proposalsLastHour(token)) >= HOURLY_LIMIT) return json({ error: "ideas is getting a lot of proposals right now. Please try again in an hour." }, 429, false);

    const gate = qualityGate(rec);
    const category = body.category && body.category !== rec.category && CATEGORY_MAP[body.category] ? body.category : undefined;
    const issue = await createProposal(token, rec, gate, { category, note: body.note?.slice(0, 280) });
    recent.set(ip, [...mine, now]);
    return json({ ok: true, state: gate.auto ? "publishing" : "pending", reasons: gate.reasons, repo: rec.fullName, issue: issue.number, track: `/add/status/${issue.number}` }, 200, false);
  } catch (e) {
    return json({ error: (e as Error).message }, e instanceof RepoFetchError ? e.status : 502, false);
  }
}

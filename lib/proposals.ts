/* Public repo proposals. Every proposal is stored durably as a GitHub issue in the catalog repo
   (label `add-repo` + `web`), so nothing submitted is ever lost:
   - quality bar met  → label `auto`    → the add-repo workflow publishes it within ~1 min
   - otherwise        → label `pending` → waits for the owner's `approved` label (weekly reminder)
   - owner rejects    → closes with label `rejected` (+ a comment with the reason) */
import type { Repo } from "./types";
import { SITE } from "./site";

export const BAR = { minStars: 50, maxIdleDays: 365 };
export const HOURLY_LIMIT = 40; // all web proposals together, counted from GitHub itself (survives cold starts)

export type Gate = { auto: boolean; reasons: string[] };
export function qualityGate(r: Repo, now = Date.now()): Gate {
  const reasons: string[] = [];
  const idle = Math.floor((now - Date.parse(r.pushedAt)) / 86_400_000);
  if (r.archived) reasons.push("archived");
  if (r.stars < BAR.minStars) reasons.push(`${r.stars} stars (auto-add needs ${BAR.minStars}+)`);
  if (idle > BAR.maxIdleDays) reasons.push(`last push ${idle} days ago (auto-add needs activity in the last ${BAR.maxIdleDays} days)`);
  return { auto: reasons.length === 0, reasons };
}

const repoSlug = () => process.env.GITHUB_REPO ?? SITE.repo;
function headers(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "ideas-portal", "X-GitHub-Api-Version": "2022-11-28" };
}
async function gh<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, { ...init, headers: { ...headers(token), ...(init?.headers ?? {}) }, cache: "no-store" });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return res.json() as Promise<T>;
}

type Issue = { number: number; html_url: string; state: "open" | "closed"; state_reason?: string | null; title: string; created_at: string; closed_at: string | null; labels: { name: string }[]; body: string | null; comments: number };

/** an open proposal for the same repo, if any (so the same repo is never queued twice).
    Uses the issues list, not search: search lags by seconds to minutes. */
export async function findOpenProposal(token: string, fullName: string): Promise<Issue | undefined> {
  const want = `add ${fullName.toLowerCase()}`;
  for (let page = 1; page <= 5; page++) {
    const r = await gh<Issue[]>(token, `/repos/${repoSlug()}/issues?labels=add-repo&state=open&per_page=100&page=${page}`);
    const hit = r.find((i) => i.title.trim().toLowerCase() === want);
    if (hit || r.length < 100) return hit;
  }
  return undefined;
}

export async function proposalsLastHour(token: string): Promise<number> {
  const since = Date.now() - 3_600_000;
  const r = await gh<Issue[]>(token, `/repos/${repoSlug()}/issues?labels=web&state=all&sort=created&direction=desc&per_page=100`);
  return r.filter((i) => Date.parse(i.created_at) >= since).length;
}

/** body in the same shape as the issue form, so scripts/add.ts --from-issue parses it unchanged */
export async function createProposal(token: string, r: Repo, gate: Gate, opts: { category?: string; note?: string }) {
  const body = [
    "### Repository URL", "", r.url, "",
    "### Category (optional — leave as auto to let the classifier decide)", "", opts.category ?? "auto", "",
    "### Why is it useful?", "", opts.note?.trim() || "_No response_", "",
    "---",
    `Submitted from ${SITE.url}/add · ★ ${r.stars} · last push ${r.pushedAt.slice(0, 10)} · classifier: ${r.category}`,
    gate.auto ? "✅ Meets the auto-add bar — publishing automatically." : `⏳ Waiting for review: ${gate.reasons.join("; ")}. The owner adds the \`approved\` label to publish it.`,
  ].join("\n");
  return gh<Issue>(token, `/repos/${repoSlug()}/issues`, {
    method: "POST",
    body: JSON.stringify({ title: `Add ${r.fullName}`, body, labels: ["add-repo", "web", gate.auto ? "auto" : "pending"] }),
  });
}

export type ProposalStatus = {
  number: number; url: string; title: string; repo: string | null; createdAt: string; closedAt: string | null;
  state: "publishing" | "pending" | "live" | "rejected" | "failed";
  reason?: string;
};

/** status of a proposal issue; only issues labelled add-repo are exposed */
export async function proposalStatus(token: string, n: number, isLive: (fullName: string) => boolean): Promise<ProposalStatus | null> {
  let i: Issue;
  try { i = await gh<Issue>(token, `/repos/${repoSlug()}/issues/${n}`); } catch { return null; }
  const labels = i.labels.map((l) => l.name);
  if (!labels.includes("add-repo")) return null;
  const repo = i.title.match(/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/)?.[1] ?? null;
  const base = { number: i.number, url: i.html_url, title: i.title, repo, createdAt: i.created_at, closedAt: i.closed_at };
  if (repo && isLive(repo)) return { ...base, state: "live" };
  if (labels.includes("rejected") || (i.state === "closed" && i.state_reason === "not_planned")) {
    let reason: string | undefined;
    if (i.comments) {
      const cs = await gh<{ body: string; author_association: string }[]>(token, `/repos/${repoSlug()}/issues/${n}/comments?per_page=50`);
      reason = cs.filter((c) => ["OWNER", "MEMBER", "COLLABORATOR"].includes(c.author_association) && !c.body.startsWith("Thanks! Here's what")).pop()?.body.slice(0, 400);
    }
    return { ...base, state: "rejected", reason };
  }
  if (i.state === "closed") return { ...base, state: "publishing" }; // added; waiting for the deploy to pick it up
  if (labels.includes("pending") && !labels.includes("approved")) return { ...base, state: "pending" };
  // auto/approved but still open well after the workflow should have run → it failed; the owner sees the error in the issue
  const ageMin = (Date.now() - Date.parse(i.created_at)) / 60_000;
  return { ...base, state: ageMin > 30 ? "failed" : "publishing" };
}

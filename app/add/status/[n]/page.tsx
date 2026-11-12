import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepo } from "@/lib/data";
import { BAR, proposalStatus } from "@/lib/proposals";
import ProposalWatch from "@/components/ProposalWatch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Proposal status", robots: { index: false } };

type P = { params: Promise<{ n: string }> };

const COPY = {
  publishing: { t: "Being added", d: "It met the quality bar and is being published. It usually goes live within a couple of minutes." },
  pending: { t: "Waiting for review", d: `It's saved and in the review queue. Repos with ${BAR.minStars}+ stars and activity in the last year go in automatically; others are reviewed by hand.` },
  live: { t: "Live on ideas", d: "It's in the catalog. Thanks for adding it!" },
  rejected: { t: "Not added", d: "The curator decided not to add this one." },
  failed: { t: "Stuck", d: "Something went wrong while publishing. It's saved and the curator can see the error, so it won't be lost." },
} as const;

export default async function StatusPage({ params }: P) {
  const n = Number((await params).n);
  const token = process.env.GITHUB_TOKEN;
  if (!token || !Number.isInteger(n) || n < 1) notFound();
  const s = await proposalStatus(token, n, (full) => { const [o, r] = full.split("/"); return Boolean(getRepo(o, r)); });
  if (!s) notFound();
  const c = COPY[s.state];
  const [owner, name] = (s.repo ?? "/").split("/");
  return (
    <main className="wrap">
      <nav className="crumbs"><Link href="/">ideas</Link> <span>/</span> <Link href="/add">Add a repo</Link> <span>/</span> <span>#{s.number}</span></nav>
      <section className="panel panel-pad">
        <div className="section-title" style={{ padding: "0 0 6px" }}>Proposal #{s.number} · {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
        <h1 style={{ margin: "4px 0 10px" }}>{s.repo ?? s.title}</h1>
        <div className="note"><b>{c.t}.</b> {c.d}</div>
        {s.state === "rejected" && s.reason && <blockquote className="muted" style={{ whiteSpace: "pre-wrap", margin: "14px 0 0" }}>{s.reason}</blockquote>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          {s.state === "live" && <Link className="btn btn-accent" href={`/r/${owner}/${name}`}>Open its page →</Link>}
          <a className="btn" href={s.url} target="_blank" rel="noopener">See it on GitHub ↗</a>
          <Link className="btn" href="/add">Add another</Link>
        </div>
        <ProposalWatch n={s.number} state={s.state} repo={s.repo} />
      </section>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Repo } from "@/lib/types";
import { CATEGORIES, getCategory } from "@/lib/taxonomy";
import { SITE } from "@/lib/site";
import { Avatar, CatIcon, SearchIcon } from "./ui";
import { CopyButton, toast } from "./client";
import { rememberProposal } from "./MyProposals";

type Analysis = { repo: Repo; exists: boolean; scores: Record<string, number> };

export default function AddForm({ initialUrl = "", canPublish }: { initialUrl?: string; canPublish: boolean }) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [a, setA] = useState<Analysis | null>(null);
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [token, setToken] = useState("");
  const [published, setPublished] = useState<{ commit?: string; path: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [proposed, setProposed] = useState<{ state: string; issue?: number; track?: string; page?: string; reasons?: string[]; duplicate?: boolean } | null>(null);
  const [hp, setHp] = useState(""); // honeypot
  const ran = useRef(false);

  useEffect(() => {
    try { setToken(localStorage.getItem("ideas-admin") ?? ""); } catch {}
    if (initialUrl && !ran.current) { ran.current = true; analyze(initialUrl); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function analyze(u = url) {
    if (!u.trim()) return;
    setBusy(true); setErr(""); setA(null); setPublished(null); setProposed(null);
    try {
      const res = await fetch(`/api/analyze?url=${encodeURIComponent(u.trim())}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Analysis failed");
      setA(j); setCategory(j.repo.category); setNote(j.repo.note ?? "");
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  async function publish() {
    if (!a) return;
    setBusy(true); setErr("");
    try {
      try { localStorage.setItem("ideas-admin", token); } catch {}
      const res = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ url: a.repo.url, category, note }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Publish failed");
      setPublished({ commit: j.commit, path: j.path }); setCountdown(75);
      toast("Committed — Vercel is deploying");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  async function propose() {
    if (!a) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/propose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: a.repo.url, category, note, website: hp }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not save your proposal");
      setProposed(j);
      if (j.issue) rememberProposal({ n: j.issue, repo: j.repo ?? a.repo.fullName, state: j.state });
      toast(j.state === "publishing" ? "Saved — adding it now" : j.state === "live" ? "Already on ideas" : "Saved — waiting for review");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const r = a?.repo;
  const cat = getCategory(category || r?.category || "devtools");
  const issueUrl = r ? `https://github.com/${SITE.repo}/issues/new?template=add-repo.yml&title=${encodeURIComponent(`Add ${r.fullName}`)}&repo_url=${encodeURIComponent(r.url)}&category=${encodeURIComponent(category)}&note=${encodeURIComponent(note)}` : "";
  const cli = r ? `npm run add -- ${r.fullName}${category !== r.category ? ` --category ${category}` : ""}${note ? ` --note "${note.replace(/"/g, "'")}"` : ""}` : "";
  const ranked = a ? Object.entries(a.scores).sort((x, y) => y[1] - x[1]).slice(0, 4) : [];
  const max = ranked[0]?.[1] || 1;

  return (
    <>
      <section className="panel">
        <form className="search-row" onSubmit={(e) => { e.preventDefault(); analyze(); }}>
          <SearchIcon />
          <input className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repo" aria-label="GitHub repository URL" autoFocus={!initialUrl} spellCheck={false} autoComplete="off" />
          <button className="btn btn-accent btn-sm" disabled={busy} type="submit">{busy && !a ? "Analyzing…" : "Analyze ↵"}</button>
        </form>
        {err && <div className="empty" style={{ color: "var(--accent)" }}>{err}</div>}
        {!a && !err && (
          <div className="empty">
            Paste any public GitHub repo. ideas reads its metadata, topics and README,<br />then picks a category, tags and a vibe score — in about a second.
          </div>
        )}
        {r && (
          <>
            <div className="detail-title">
              <Avatar src={r.avatar} alt="" lg />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1><span>{r.owner}/</span>{r.name}</h1>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <span className="kbd">★ {r.stars.toLocaleString("en-US")}</span>
                  {r.language && <span className="kbd">{r.language}</span>}
                  {r.license && <span className="kbd">{r.license}</span>}
                  {a.exists && <span className="kbd kbd-accent">already listed</span>}
                </div>
              </div>
            </div>
            <p className="lede">{r.description}</p>
            <div className="panel-pad" style={{ borderTop: "1px solid var(--line-soft)" }}>
              <div className="section-title" style={{ padding: "0 0 8px" }}>Classifier confidence</div>
              {ranked.map(([slug, s]) => {
                const c = getCategory(slug);
                return (
                  <div key={slug} style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}>
                    <span className="swatch" style={{ background: c.color }} />
                    <span style={{ width: 150, fontSize: 12.5 }}>{c.name}</span>
                    <span className="bar" style={{ flex: 1, width: "auto" }}><i style={{ width: `${(s / max) * 100}%`, background: c.color }} /></span>
                    <span className="mono muted" style={{ width: 40, textAlign: "right", fontSize: 11.5 }}>{s}</span>
                  </div>
                );
              })}
              <label className="lbl" htmlFor="cat">Category</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <CatIcon color={cat.color} glyph={cat.glyph} />
                <select id="cat" className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <label className="lbl">Tags</label>
              <div className="chips">{r.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>
              <label className="lbl" htmlFor="note">Why is it useful? (optional note)</label>
              <textarea id="note" className="field" value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Best way to add passkeys to a Next.js app in 10 minutes" />
            </div>

            {published ? (
              <div className="panel-pad" style={{ borderTop: "1px solid var(--line-soft)" }}>
                <div className="note">
                  <b>Published.</b> {countdown > 0 ? `Live in ~${countdown}s while Vercel rebuilds.` : "Should be live now."}{" "}
                  <a href={`/r/${r.owner}/${r.name}`} style={{ textDecoration: "underline" }}>Open page</a>
                  {published.commit && <> · <a href={published.commit} target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>commit</a></>}
                </div>
              </div>
            ) : (
              <div className="panel-pad" style={{ borderTop: "1px solid var(--line-soft)" }}>
                {canPublish && (
                  <>
                    <label className="lbl" htmlFor="tok">Curator key</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input id="tok" type="password" className="field" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_TOKEN" autoComplete="current-password" />
                      <button type="button" className="btn btn-accent" style={{ height: 40 }} disabled={busy || !token} onClick={publish}>{busy ? "Publishing…" : a.exists ? "Update" : "Publish"}</button>
                    </div>
                  </>
                )}
                {proposed ? (
                  <div className="note" style={{ marginTop: canPublish ? 14 : 0 }}>
                    {proposed.state === "live" ? (
                      <><b>Already on ideas.</b> <a href={proposed.page} style={{ textDecoration: "underline" }}>Open its page</a></>
                    ) : proposed.state === "publishing" ? (
                      <><b>{proposed.duplicate ? "Someone already proposed it —" : "Saved."}</b> It meets the quality bar, so it&apos;s being added now (usually live in a couple of minutes). </>
                    ) : (
                      <><b>{proposed.duplicate ? "Already in the review queue." : "Saved."}</b> It&apos;s in the review queue{proposed.reasons?.length ? ` (${proposed.reasons.join("; ")})` : ""}. Nothing gets lost: you can follow it any time. </>
                    )}
                    {proposed.track && <a href={proposed.track} style={{ textDecoration: "underline" }}>Track proposal #{proposed.issue} →</a>}
                  </div>
                ) : (
                  <>
                    <p className="muted" style={{ fontSize: 12.5, margin: canPublish ? "14px 0 8px" : "0 0 8px" }}>{a.exists ? "This repo is already listed." : "Add it to ideas — no account needed. Repos with 50+ stars and activity in the last year go live automatically; others are reviewed."}</p>
                    <input type="text" name="website" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {!a.exists && <button type="button" className="btn btn-accent" disabled={busy} onClick={propose}>{busy ? "Saving…" : "Add to ideas"}</button>}
                      <a className="btn" href={issueUrl} target="_blank" rel="noopener">Propose via GitHub issue ↗</a>
                      <CopyButton className="btn" text={cli} label="Copy CLI command" msg="CLI command copied" />
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
        <div className="actionbar">
          <span className="left">Auto-categorize · auto-tag · vibe score</span>
          <span className="right"><span className="act">Analyze <span className="kbd">↵</span></span></span>
        </div>
      </section>
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchDocs } from "@/lib/search";
import { AI_PROMPT, SITE } from "@/lib/site";
import type { Doc } from "@/lib/types";
import { Avatar, CatIcon, CmdIcon, SearchIcon } from "./ui";
import { copyText, toast } from "./client";

export type PaletteCat = { slug: string; name: string; color: string; glyph: string; count: number };
export type PaletteData = { docs: Doc[]; cats: PaletteCat[]; tags: { tag: string; count: number }[] };

type Action = { label: string; kbd?: string; run: () => void };
type Item = {
  key: string;
  section: string;
  title: string;
  sub?: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
  run: () => void;
  actions?: Action[];
};

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n));
const GH_RE = /(?:github\.com[/:])?([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;

const PLACEHOLDERS = [
  "Search 200+ repos, categories, tags…",
  "Try “auth for next.js”",
  "Describe a project: “AI SaaS with payments”",
  "Paste a GitHub URL to add it",
  "Try “local llm”, “vector db”, “tui”…",
];

export default function Palette({ data: initial, modal, onClose, autoFocus }: { data?: PaletteData; modal?: boolean; onClose?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<PaletteData | undefined>(initial);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actSel, setActSel] = useState(0);
  const [ph, setPh] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data) return;
    fetch("/api/palette").then((r) => r.json()).then(setData).catch(() => toast("Could not load the catalog"));
  }, [data]);

  useEffect(() => {
    if (autoFocus || modal) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus, modal]);

  useEffect(() => {
    const t = setInterval(() => setPh((p) => (p + 1) % PLACEHOLDERS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const go = useCallback(
    (href: string) => {
      onClose?.();
      if (href.startsWith("http")) window.open(href, "_blank", "noopener");
      else router.push(href);
    },
    [router, onClose],
  );

  const repoItem = useCallback(
    (d: Doc, section: string): Item => ({
      key: `r:${d.id}`,
      section,
      title: d.name,
      sub: d.description,
      icon: <Avatar src={d.avatar} alt="" />,
      right: (
        <>
          <span className="hide-sm mono">{d.owner}</span>
          <span className="kbd">★ {fmt(d.stars)}</span>
        </>
      ),
      run: () => go(`/r/${d.owner}/${d.name}`),
      actions: [
        { label: "Open details", kbd: "↵", run: () => go(`/r/${d.owner}/${d.name}`) },
        { label: "Open on GitHub", kbd: "⌘↵", run: () => go(`https://github.com/${d.fullName}`) },
        { label: "Copy clone command", run: () => copyText(`git clone https://github.com/${d.fullName}.git`, "Clone command copied") },
        { label: "Copy AI-readable link (.md)", run: () => copyText(`${SITE.url}/r/${d.owner}/${d.name}.md`, "Markdown link copied") },
        { label: "Find alternatives", run: () => go(`/c/${d.category}`) },
      ],
    }),
    [go],
  );

  const items = useMemo<Item[]>(() => {
    if (!data) return [];
    const query = q.trim();
    const out: Item[] = [];
    const cmds: Item[] = [
      { key: "c:stack", section: "Commands", title: "Build a stack from a sentence", sub: "Describe your project, get the repos", icon: <CmdIcon>✦</CmdIcon>, right: <span className="kbd">S</span>, run: () => go(query ? `/stack?q=${encodeURIComponent(query)}` : "/stack") },
      { key: "c:add", section: "Commands", title: "Add a GitHub repo", sub: "Paste a URL — auto-categorized & tagged", icon: <CmdIcon>＋</CmdIcon>, right: <span className="kbd">A</span>, run: () => go("/add") },
      { key: "c:ai", section: "Commands", title: "Connect your AI", sub: "MCP server, llms.txt, JSON API", icon: <CmdIcon>⌁</CmdIcon>, right: <span className="kbd">AI</span>, run: () => go("/ai") },
      { key: "c:prompt", section: "Commands", title: "Copy prompt for CLAUDE.md / .cursorrules", sub: "Make your agent use this catalog", icon: <CmdIcon>⧉</CmdIcon>, run: () => copyText(AI_PROMPT, "AI prompt copied — paste it into your agent rules") },
      { key: "c:random", section: "Commands", title: "Surprise me", sub: "Open a random repo", icon: <CmdIcon>⚄</CmdIcon>, run: () => { const d = data.docs[Math.floor(Math.random() * data.docs.length)]; go(`/r/${d.owner}/${d.name}`); } },
      { key: "c:browse", section: "Commands", title: "Browse all categories", icon: <CmdIcon>▦</CmdIcon>, run: () => go("/c") },
    ];

    if (!query) {
      out.push(...cmds.slice(0, 5));
      const recent = [...data.docs].sort((a, b) => b.addedAt.localeCompare(a.addedAt) || b.vibe - a.vibe).slice(0, 5);
      out.push(...recent.map((d) => repoItem(d, "Recently added")));
      out.push(
        ...data.cats.map((c) => ({
          key: `cat:${c.slug}`, section: "Categories", title: c.name, icon: <CatIcon color={c.color} glyph={c.glyph} />,
          right: <span className="kbd">{c.count}</span>, run: () => go(`/c/${c.slug}`),
        })),
      );
      return out;
    }

    const gh = query.match(GH_RE);
    if (gh && (query.includes("github.com") || (query.includes("/") && !query.includes(" ")))) {
      const full = `${gh[1]}/${gh[2]}`;
      const known = data.docs.find((d) => d.id === full.toLowerCase());
      if (known) out.push({ ...repoItem(known, "Already in the catalog") });
      else out.push({ key: "c:addurl", section: "Add", title: `Analyze & add ${full}`, sub: "Fetch, categorize and tag it", icon: <CmdIcon>＋</CmdIcon>, right: <span className="kbd kbd-accent">↵</span>, run: () => go(`/add?url=${encodeURIComponent(`https://github.com/${full}`)}`) });
    }
    const words = query.split(/\s+/).filter(Boolean).length;
    if (words >= 3) {
      out.push({ key: "c:stackq", section: "Stack builder", title: `Build a stack for “${query}”`, sub: "Picks the best repo for every need it detects", icon: <CmdIcon>✦</CmdIcon>, right: <span className="kbd kbd-accent">↵</span>, run: () => go(`/stack?q=${encodeURIComponent(query)}`) });
    }
    const hits = searchDocs(data.docs, query, { limit: 9 });
    out.push(...hits.map((h) => repoItem(h.doc, "Repositories")));
    const ql = query.toLowerCase();
    const cats = data.cats.filter((c) => c.name.toLowerCase().includes(ql) || c.slug.includes(ql)).slice(0, 3);
    out.push(...cats.map((c) => ({ key: `cat:${c.slug}`, section: "Categories", title: c.name, icon: <CatIcon color={c.color} glyph={c.glyph} />, right: <span className="kbd">{c.count}</span>, run: () => go(`/c/${c.slug}`) })));
    const tags = data.tags.filter((t) => t.tag.includes(ql.replace(/\s+/g, "-"))).slice(0, 4);
    out.push(...tags.map((t) => ({ key: `tag:${t.tag}`, section: "Tags", title: `#${t.tag}`, icon: <CmdIcon>#</CmdIcon>, right: <span className="kbd">{t.count}</span>, run: () => go(`/t/${t.tag}`) })));
    const cm = cmds.filter((c) => (c.title + " " + (c.sub ?? "")).toLowerCase().includes(ql));
    out.push(...cm);
    if (words < 3 && hits.length < 3) out.push({ ...cmds[0], key: "c:stack2", section: "Stack builder", title: `Build a stack for “${query}”` });
    return out;
  }, [data, q, go, repoItem]);

  useEffect(() => {
    setSel(0);
    setActionsOpen(false);
  }, [q]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const current = items[sel];
  const actions: Action[] = current?.actions ?? [{ label: "Open", kbd: "↵", run: () => current?.run() }];

  function onKey(e: React.KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === "k") {
      e.preventDefault();
      e.stopPropagation();
      setActSel(0);
      setActionsOpen((o) => !o);
      return;
    }
    if (actionsOpen) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActSel((s) => (s + 1) % actions.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActSel((s) => (s - 1 + actions.length) % actions.length); }
      else if (e.key === "Enter") { e.preventDefault(); actions[actSel]?.run(); setActionsOpen(false); }
      else if (e.key === "Escape") { e.preventDefault(); setActionsOpen(false); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (meta && current?.actions?.[1]) current.actions[1].run();
      else current?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (q) setQ("");
      else onClose?.();
    }
  }

  let lastSection = "";
  return (
    <div className="panel palette" data-inline-palette={modal ? undefined : ""} onKeyDown={onKey}>
      <div className="search-row">
        <SearchIcon />
        <input
          ref={inputRef}
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search repositories, categories and commands"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-activedescendant={current ? `pi-${sel}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        {!q && (
          <div className="search-ghost" aria-hidden>
            <span className="caret" />
            <span>{PLACEHOLDERS[ph]}</span>
          </div>
        )}
        {modal ? <span className="kbd">esc</span> : <span className="kbd">⌘K</span>}
      </div>
      <div className="results" id="palette-results" role="listbox" ref={listRef}>
        {!data && <div className="empty">Loading catalog…</div>}
        {data && !items.length && (
          <div className="empty">
            No results for <b>“{q}”</b>.<br />
            Press <span className="kbd">esc</span> to clear, or{" "}
            <a href={`/stack?q=${encodeURIComponent(q)}`} style={{ color: "var(--accent)" }}>
              try the stack builder
            </a>
            .
          </div>
        )}
        {items.map((it, i) => {
          const head = it.section !== lastSection;
          lastSection = it.section;
          return (
            <div key={it.key}>
              {head && <div className="section-title">{it.section}</div>}
              <div
                id={`pi-${i}`}
                data-i={i}
                role="option"
                aria-selected={i === sel}
                className={`row${i === sel ? " sel" : ""}`}
                onMouseMove={() => sel !== i && setSel(i)}
                onClick={() => it.run()}
              >
                {it.icon}
                <span className="row-main">
                  <span className="row-name">{it.title}</span>
                  {it.sub && <span className="row-sub">{it.sub}</span>}
                </span>
                {it.right && <span className="row-right">{it.right}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {actionsOpen && current && (
        <div className="actions-pop" role="menu">
          <div className="section-title" style={{ paddingTop: 6 }}>{current.title}</div>
          {actions.map((a, i) => (
            <div key={a.label} role="menuitem" className={`row${i === actSel ? " sel" : ""}`} onMouseMove={() => setActSel(i)} onClick={() => { a.run(); setActionsOpen(false); }}>
              <span className="row-main"><span className="row-name">{a.label}</span></span>
              {a.kbd && <span className="kbd">{a.kbd}</span>}
            </div>
          ))}
        </div>
      )}
      <div className="actionbar">
        <span className="left">
          <span className="brand-mark" style={{ width: 16, height: 16, fontSize: 9, borderRadius: 4 }}>i</span>
          <span className="hide-sm">{data ? `${data.docs.length} repos · ${data.cats.length} categories` : "ideas"}</span>
          <span className="hide-sm" style={{ color: "var(--text-3)" }}>·</span>
          <span style={{ color: "var(--text-3)" }}>↑↓ to move</span>
        </span>
        <span className="right">
          <button type="button" className="act" onClick={() => current?.run()}>
            Open <span className="kbd">↵</span>
          </button>
          <span className="sep" />
          <button type="button" className="act" onClick={() => { setActSel(0); setActionsOpen((o) => !o); inputRef.current?.focus(); }}>
            Actions <span className="kbd">⌘K</span>
          </button>
        </span>
      </div>
    </div>
  );
}

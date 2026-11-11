import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/client";
import { Avatar, CatIcon, SearchIcon } from "@/components/ui";
import { allDocs, fmtStars } from "@/lib/data";
import { stackMd } from "@/lib/md";
import { buildStack } from "@/lib/search";
import { SITE } from "@/lib/site";
import { getCategory } from "@/lib/taxonomy";

type P = { searchParams: Promise<{ q?: string }> };

const EXAMPLES = [
  "AI SaaS with auth, Stripe payments and chat over my PDFs",
  "Self-hosted analytics and uptime monitoring for my side project",
  "Mobile app with a local LLM and voice input",
  "Internal tool that automates workflows with AI agents",
  "Beautiful landing page with animations and a blog",
  "Terminal UI tool in Go",
];

export async function generateMetadata({ searchParams }: P): Promise<Metadata> {
  const { q } = await searchParams;
  return q
    ? { title: `Open-source stack for “${q.slice(0, 80)}”`, description: `Repos picked by the ideas stack builder for: ${q.slice(0, 140)}`, robots: { index: false, follow: true }, alternates: { canonical: "/stack" } }
    : { title: "Stack builder — describe your project, get the repos", description: "Type one sentence about what you're building. ideas detects every need (auth, payments, AI, database, deploy…) and picks the best open-source repo for each.", alternates: { canonical: "/stack" } };
}

export default async function StackPage({ searchParams }: P) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 300);
  const result = query ? buildStack(allDocs(), query) : null;

  return (
    <main className="wrap wrap-wide">
      <nav className="crumbs"><Link href="/">ideas</Link> <span>/</span> <span>Stack builder</span></nav>
      <section className="panel">
        <form action="/stack" method="get" className="search-row" role="search">
          <SearchIcon />
          <input name="q" className="search-input" defaultValue={query} placeholder="Describe what you're building…" autoFocus={!query} aria-label="Project description" autoComplete="off" />
          <button className="btn btn-accent btn-sm" type="submit">Build <span style={{ opacity: 0.7 }}>↵</span></button>
        </form>

        {!result && (
          <div className="panel-body">
            <div className="section-title">Try one</div>
            {EXAMPLES.map((e) => (
              <Link key={e} href={`/stack?q=${encodeURIComponent(e)}`} className="row">
                <span className="ico ico-cmd">✦</span>
                <span className="row-main"><span className="row-name" style={{ whiteSpace: "normal" }}>{e}</span></span>
                <span className="row-right"><span className="kbd">↵</span></span>
              </Link>
            ))}
          </div>
        )}

        {result && (
          <div className="panel-body">
            {result.needs.length === 0 && result.more.length === 0 && (
              <div className="empty">Nothing matched <b>“{query}”</b>. Try naming concrete parts: auth, payments, chat, database, deploy…</div>
            )}
            {result.needs.map((n) => {
              const c = getCategory(n.category);
              return (
                <div key={n.id} className="need">
                  <div className="section-title">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span className="swatch" style={{ background: c.color }} /> {n.label}
                    </span>
                    <Link href={`/c/${c.slug}`}>{c.name} →</Link>
                  </div>
                  {n.picks.map((d, i) => (
                    <Link key={d.id} href={`/r/${d.owner}/${d.name}`} className={`row${i === 0 ? " sel" : ""}`}>
                      <Avatar src={d.avatar} alt="" />
                      <span className="row-main">
                        <span className="row-name">{d.name}</span>
                        <span className="row-sub">{d.description}</span>
                      </span>
                      <span className="row-right">
                        {i === 0 && <span className="kbd kbd-accent hide-sm">best fit</span>}
                        <span className="kbd">★ {fmtStars(d.stars)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              );
            })}
            {result.more.length > 0 && (
              <div className="need">
                <div className="section-title">Also worth a look</div>
                {result.more.map((d) => (
                  <Link key={d.id} href={`/r/${d.owner}/${d.name}`} className="row">
                    <Avatar src={d.avatar} alt="" />
                    <span className="row-main"><span className="row-name">{d.name}</span><span className="row-sub">{d.description}</span></span>
                    <span className="row-right"><CatIcon color={getCategory(d.category).color} glyph={getCategory(d.category).glyph} /></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="actionbar">
          <span className="left">{result ? `${result.needs.length} needs detected` : "One sentence → a whole stack"}</span>
          {result && (
            <span className="right">
              <CopyButton className="act" text={stackMd(result)} label="Copy as Markdown" msg="Stack copied — paste it to your AI" />
              <span className="sep hide-sm" />
              <a className="act hide-sm" href={`/api/stack?q=${encodeURIComponent(query)}&format=md`}>API <span className="kbd">.md</span></a>
            </span>
          )}
        </div>
      </section>

      <section className="panel stack-gap">
        <div className="panel-pad">
          <h2 className="h" style={{ marginBottom: 8 }}>Let your AI do this</h2>
          <p className="muted" style={{ margin: "0 0 10px" }}>Any agent that can fetch a URL can call the stack builder directly:</p>
          <div className="code code-wrap" style={{ paddingRight: 70 }}>
            GET {SITE.url}/api/stack?q=<span className="a">{"{your project}"}</span>&amp;format=md
            <CopyButton text={`${SITE.url}/api/stack?q=&format=md`} />
          </div>
        </div>
      </section>
    </main>
  );
}

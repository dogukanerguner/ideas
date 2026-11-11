import Link from "next/link";
import Palette from "@/components/Palette";
import RepoRow from "@/components/RepoRow";
import { CopyButton } from "@/components/client";
import { CatIcon, JsonLd } from "@/components/ui";
import { allRepos, categoryCounts, GENERATED_AT, popularTags } from "@/lib/data";
import { paletteData } from "@/lib/palette";
import { AI_PROMPT, SITE } from "@/lib/site";
import { getCategory } from "@/lib/taxonomy";

export default function Home() {
  const repos = allRepos();
  const data = paletteData();
  const top = [...repos].sort((a, b) => b.vibe - a.vibe).slice(0, 12);
  const tags = popularTags(4).slice(0, 36);
  const counts = categoryCounts().filter((c) => c.count);
  const totalStars = repos.reduce((s, r) => s + r.stars, 0);

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: SITE.title,
          url: SITE.url,
          description: SITE.description,
          mainEntity: { "@type": "ItemList", numberOfItems: repos.length, itemListElement: top.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/r/${r.owner}/${r.name}`, name: r.fullName })) },
        }}
      />
      <div className="wrap">
        <section className="hero">
          <span className="kicker">
            <span className="dot" /> {repos.length} repos · updated {GENERATED_AT.slice(0, 10)}
          </span>
          <h1>
            Every repo worth <em>vibing</em> with.
            <br />
            One keystroke away.
          </h1>
          <p>Search it, paste a GitHub link to add it, or describe your project and get a whole stack. Your AI can read all of it.</p>
        </section>

        <Palette data={data} autoFocus />

        <div className="stats" aria-label="Catalog stats">
          <span><b>{repos.length}</b> repos</span>
          <span><b>{counts.length}</b> categories</span>
          <span><b>{(totalStars / 1_000_000).toFixed(1)}M</b> combined stars</span>
          <span><span className="kbd">/</span> or <span className="kbd">⌘K</span> anywhere</span>
        </div>

        <section className="panel stack-gap" aria-labelledby="ai-h">
          <div className="panel-head">
            <span className="ico ico-cmd">⌁</span>
            <div style={{ flex: 1 }}>
              <h2 id="ai-h">Tell your AI to shop here</h2>
              <div className="sub">Paste into CLAUDE.md, AGENTS.md or .cursorrules — or connect the MCP server.</div>
            </div>
          </div>
          <div className="panel-pad">
            <div className="code code-wrap" style={{ paddingRight: 70 }}>
              {AI_PROMPT}
              <CopyButton text={AI_PROMPT} msg="Prompt copied — paste it into your agent rules" />
            </div>
            <div className="code" style={{ marginTop: 10, paddingRight: 70 }}>
              <span className="c"># Claude Code</span>
              {"\n"}claude mcp add --transport http ideas {SITE.url}/mcp
              <CopyButton text={`claude mcp add --transport http ideas ${SITE.url}/mcp`} msg="MCP command copied" />
            </div>
            <p className="muted" style={{ margin: "10px 2px 0", fontSize: 12.5 }}>
              Or just say: <span className="mono" style={{ color: "var(--text)" }}>“find repos for my project on ideas.asveas.com”</span> — every page has a clean <span className="mono">.md</span> twin. <Link href="/ai" style={{ color: "var(--accent)" }}>All integrations →</Link>
            </p>
          </div>
        </section>

        <section className="panel stack-gap" aria-labelledby="cat-h">
          <div className="section-title" style={{ padding: "14px 18px 4px" }}>
            <h2 id="cat-h" className="h">Categories</h2>
            <Link href="/c">All →</Link>
          </div>
          <div className="panel-body grid2">
            {counts.map(({ slug, count }) => {
              const c = getCategory(slug);
              return (
                <Link key={slug} href={`/c/${slug}`} className="row">
                  <CatIcon color={c.color} glyph={c.glyph} />
                  <span className="row-main"><span className="row-name">{c.name}</span></span>
                  <span className="row-right"><span className="kbd">{count}</span></span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="panel stack-gap" aria-labelledby="top-h">
          <div className="section-title" style={{ padding: "14px 18px 4px" }}>
            <h2 id="top-h" className="h">Highest vibe score</h2>
            <span className="mono" style={{ fontSize: 11 }}>popularity + freshness + hygiene</span>
          </div>
          <div className="panel-body">
            {top.map((r, i) => <RepoRow key={r.id} r={r} rank={i + 1} />)}
          </div>
        </section>

        <section className="panel stack-gap" aria-labelledby="tag-h">
          <div className="section-title" style={{ padding: "14px 18px 4px" }}>
            <h2 id="tag-h" className="h">Popular tags</h2>
            <Link href="/t">All tags →</Link>
          </div>
          <div className="panel-pad chips">
            {tags.map((t) => (
              <Link key={t.tag} href={`/t/${t.tag}`} className="chip">#{t.tag} <span style={{ color: "var(--text-3)" }}>{t.count}</span></Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

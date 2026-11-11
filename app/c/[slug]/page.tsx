import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RepoRow from "@/components/RepoRow";
import { CatIcon, JsonLd } from "@/components/ui";
import { categoryCounts, fmtStars, reposInCategory } from "@/lib/data";
import { SITE } from "@/lib/site";
import { CATEGORY_MAP } from "@/lib/taxonomy";

type P = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return categoryCounts().filter((c) => c.count).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const c = CATEGORY_MAP[slug];
  if (!c) return {};
  const items = reposInCategory(slug);
  const year = new Date().getFullYear();
  return {
    title: `Best ${c.name} repos on GitHub (${year}) — ${items.length} picks`,
    description: `${c.blurb} Top picks: ${items.slice(0, 4).map((r) => r.name).join(", ")}. Ranked by vibe score.`,
    alternates: { canonical: `/c/${slug}`, types: { "text/markdown": `/c/${slug}.md` } },
  };
}

export default async function CategoryPage({ params }: P) {
  const { slug } = await params;
  const c = CATEGORY_MAP[slug];
  if (!c) notFound();
  const items = reposInCategory(slug);
  const primary = items.filter((r) => r.category === slug);
  const secondary = items.filter((r) => r.category !== slug);
  const tagCount = new Map<string, number>();
  for (const r of items) for (const t of r.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const topTags = [...tagCount.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 16);
  const faq = [
    { q: `What are the best ${c.name.toLowerCase()} repositories?`, a: `By vibe score (popularity, freshness and hygiene), the top ${c.name} picks are ${primary.slice(0, 5).map((r) => `${r.fullName} (${fmtStars(r.stars)}★)`).join(", ")}.` },
    { q: `When do I need ${c.name.toLowerCase()}?`, a: `Use these when ${c.useWhen}.` },
  ];

  return (
    <main className="wrap wrap-wide">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "CollectionPage", name: `${c.name} repositories`, url: `${SITE.url}/c/${slug}`, description: c.blurb, mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items.slice(0, 50).map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/r/${r.owner}/${r.name}`, name: r.fullName })) } },
            { "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
            { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "ideas", item: SITE.url }, { "@type": "ListItem", position: 2, name: "Categories", item: `${SITE.url}/c` }, { "@type": "ListItem", position: 3, name: c.name, item: `${SITE.url}/c/${slug}` }] },
          ],
        }}
      />
      <nav className="crumbs"><Link href="/">ideas</Link> <span>/</span> <Link href="/c">Categories</Link> <span>/</span> <span>{c.name}</span></nav>
      <section className="panel">
        <div className="panel-head">
          <CatIcon color={c.color} glyph={c.glyph} lg />
          <div style={{ flex: 1 }}>
            <h1>{c.name}</h1>
            <div className="sub">{c.blurb}</div>
          </div>
          <span className="kbd">{items.length}</span>
        </div>
        <div className="panel-pad" style={{ borderBottom: "1px solid var(--line-soft)" }}>
          <p className="prose" style={{ margin: 0 }}>Use these when {c.useWhen}.</p>
          {topTags.length > 0 && (
            <div className="chips" style={{ marginTop: 12 }}>
              {topTags.map(([t, n]) => <Link key={t} href={`/t/${t}`} className="chip">#{t} <span style={{ color: "var(--text-3)" }}>{n}</span></Link>)}
            </div>
          )}
        </div>
        <div className="panel-body">
          <div className="section-title">Ranked by vibe score</div>
          {primary.map((r, i) => <RepoRow key={r.id} r={r} rank={i + 1} />)}
          {secondary.length > 0 && <div className="section-title">Also useful here</div>}
          {secondary.map((r) => <RepoRow key={r.id} r={r} />)}
        </div>
        <div className="actionbar">
          <span className="left">Ask your AI: <span className="mono" style={{ color: "var(--text)" }}>{SITE.url.replace("https://", "")}/c/{slug}.md</span></span>
          <span className="right"><a className="act" href={`/c/${slug}.md`}>Markdown <span className="kbd">.md</span></a></span>
        </div>
      </section>
      <section className="panel stack-gap faq">
        <div className="panel-body">
          {faq.map((f) => (<details key={f.q} open><summary>{f.q}</summary><p>{f.a}</p></details>))}
        </div>
      </section>
    </main>
  );
}

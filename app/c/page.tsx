import type { Metadata } from "next";
import Link from "next/link";
import { CatIcon, JsonLd } from "@/components/ui";
import { categoryCounts, reposInCategory } from "@/lib/data";
import { SITE } from "@/lib/site";
import { getCategory } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "All categories — open-source repos for every part of your stack",
  description: "Browse curated GitHub repositories by category: AI agents, LLM tools, MCP servers, UI kits, SaaS starters, auth, databases, DevOps and more.",
  alternates: { canonical: "/c" },
};

export default function Categories() {
  const counts = categoryCounts().filter((c) => c.count);
  return (
    <main className="wrap wrap-wide">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "ideas categories", itemListElement: counts.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/c/${c.slug}`, name: getCategory(c.slug).name })) }} />
      <nav className="crumbs"><Link href="/">ideas</Link> <span>/</span> <span>Categories</span></nav>
      <section className="panel">
        <div className="panel-head">
          <span className="ico ico-cmd">▦</span>
          <div><h1>Categories</h1><div className="sub">{counts.length} categories · every repo is auto-classified on add</div></div>
        </div>
        <div className="panel-body">
          {counts.map(({ slug, count }) => {
            const c = getCategory(slug);
            const top = reposInCategory(slug).slice(0, 3).map((r) => r.name).join(", ");
            return (
              <Link key={slug} href={`/c/${slug}`} className="row">
                <CatIcon color={c.color} glyph={c.glyph} />
                <span className="row-main"><span className="row-name">{c.name}</span><span className="row-sub">{top}</span></span>
                <span className="row-right"><span className="kbd">{count}</span></span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RepoRow from "@/components/RepoRow";
import { JsonLd } from "@/components/ui";
import { popularTags, tagIndex } from "@/lib/data";
import { SITE } from "@/lib/site";

type P = { params: Promise<{ tag: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return popularTags(3).map((t) => ({ tag: t.tag }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { tag } = await params;
  const items = tagIndex().get(decodeURIComponent(tag)) ?? [];
  if (!items.length) return {};
  return {
    title: `${items.length} best #${tag} repos on GitHub`,
    description: `Curated open-source ${tag} repositories: ${items.slice(0, 5).map((r) => r.name).join(", ")} and more — ranked by vibe score.`,
    alternates: { canonical: `/t/${tag}`, types: { "text/markdown": `/t/${tag}.md` } },
  };
}

export default async function TagPage({ params }: P) {
  const { tag: raw } = await params;
  const tag = decodeURIComponent(raw);
  const items = tagIndex().get(tag);
  if (!items || items.length < 3) notFound();
  return (
    <main className="wrap wrap-wide">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: `#${tag} repositories`, url: `${SITE.url}/t/${tag}`, mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items.slice(0, 50).map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/r/${r.owner}/${r.name}`, name: r.fullName })) } }} />
      <nav className="crumbs"><Link href="/">ideas</Link> <span>/</span> <Link href="/t">Tags</Link> <span>/</span> <span>#{tag}</span></nav>
      <section className="panel">
        <div className="panel-head"><span className="ico ico-cmd">#</span><div style={{ flex: 1 }}><h1>#{tag}</h1><div className="sub">Repositories tagged {tag}, ranked by vibe score</div></div><span className="kbd">{items.length}</span></div>
        <div className="panel-body">{items.map((r, i) => <RepoRow key={r.id} r={r} rank={i + 1} />)}</div>
        <div className="actionbar"><span className="left">Machine-readable</span><span className="right"><a className="act" href={`/t/${tag}.md`}>Markdown <span className="kbd">.md</span></a></span></div>
      </section>
    </main>
  );
}

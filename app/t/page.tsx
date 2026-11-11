import type { Metadata } from "next";
import Link from "next/link";
import { popularTags } from "@/lib/data";

export const metadata: Metadata = {
  title: "All tags — find GitHub repos by technology",
  description: "Every technology tag in the ideas catalog: react, nextjs, python, rust, llm, mcp, self-hosted, rag and hundreds more.",
  alternates: { canonical: "/t" },
};

export default function Tags() {
  const tags = popularTags(3);
  return (
    <main className="wrap wrap-wide">
      <nav className="crumbs"><Link href="/">ideas</Link> <span>/</span> <span>Tags</span></nav>
      <section className="panel">
        <div className="panel-head"><span className="ico ico-cmd">#</span><div><h1>Tags</h1><div className="sub">{tags.length} tags with 3+ repos</div></div></div>
        <div className="panel-pad chips">
          {tags.map((t) => <Link key={t.tag} href={`/t/${t.tag}`} className="chip">#{t.tag} <span style={{ color: "var(--text-3)" }}>{t.count}</span></Link>)}
        </div>
      </section>
    </main>
  );
}

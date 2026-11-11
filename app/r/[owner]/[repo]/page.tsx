import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RepoRow from "@/components/RepoRow";
import { CopyButton } from "@/components/client";
import { Avatar, CatIcon, JsonLd, Vibe } from "@/components/ui";
import { ago, allRepos, alternatives, fmtStars, getRepo, maintenanceSentence, related, useWhenSentence } from "@/lib/data";
import { SITE } from "@/lib/site";
import { getCategory } from "@/lib/taxonomy";

type P = { params: Promise<{ owner: string; repo: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return allRepos().map((r) => ({ owner: r.owner, repo: r.name }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { owner, repo } = await params;
  const r = getRepo(owner, repo);
  if (!r) return {};
  const c = getCategory(r.category);
  const title = `${r.name} — ${c.short} for vibecoders (${fmtStars(r.stars)}★)`;
  const description = `${r.description || r.fullName}`.slice(0, 155) + ` · ${c.name}, ${r.language ?? "multi-language"}, alternatives & AI-ready summary.`;
  const path = `/r/${r.owner}/${r.name}`;
  return {
    title,
    description,
    keywords: [r.name, r.fullName, ...r.tags, c.name, `${r.name} alternatives`],
    alternates: { canonical: path, types: { "text/markdown": `${path}.md` } },
    openGraph: { title: `${r.fullName} · ideas`, description, url: path, type: "article" },
  };
}

export default async function RepoPage({ params }: P) {
  const { owner, repo } = await params;
  const r = getRepo(owner, repo);
  if (!r) notFound();
  const c = getCategory(r.category);
  const alts = alternatives(r, 6);
  const rel = related(r, 6, new Set(alts.map((a) => a.id)));
  const path = `/r/${r.owner}/${r.name}`;
  const clone = `git clone https://github.com/${r.fullName}.git`;
  const aiPrompt = `Read ${SITE.url}${path}.md and help me add ${r.fullName} to my project. Explain the setup steps for my stack and show the minimal code to get it working.`;
  const faq = [
    { q: `What is ${r.name}?`, a: `${r.fullName} is ${/^[aeiou]/i.test(c.short) ? "an" : "a"} ${c.short} on GitHub: ${r.description || "no description provided."}${r.readme ? ` ${r.readme.split(/(?<=[.!?])\s/)[0]}` : ""}` },
    { q: `When should I use ${r.name}?`, a: useWhenSentence(r) },
    { q: `What are the best alternatives to ${r.name}?`, a: alts.length ? `Popular alternatives in ${c.name}: ${alts.slice(0, 5).map((a) => `${a.fullName} (${fmtStars(a.stars)}★)`).join(", ")}.` : `It is currently the only ${c.name} repo in the catalog.` },
    { q: `Is ${r.name} actively maintained?`, a: maintenanceSentence(r) },
    { q: `What license does ${r.name} use?`, a: r.license ? `${r.fullName} is published under the ${r.license} license. Check the repository's LICENSE file before commercial use.` : `No license was detected on GitHub — treat it as "all rights reserved" until the author adds one.` },
  ];

  return (
    <main className="wrap wrap-wide">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "SoftwareSourceCode",
              "@id": `${SITE.url}${path}#code`,
              name: r.name,
              description: r.description,
              codeRepository: r.url,
              url: `${SITE.url}${path}`,
              programmingLanguage: r.language ?? undefined,
              license: r.license ?? undefined,
              keywords: r.tags.join(", "),
              dateCreated: r.createdAt,
              dateModified: r.pushedAt,
              author: { "@type": "Organization", name: r.owner, url: `https://github.com/${r.owner}` },
              applicationCategory: c.name,
              ...(r.homepage ? { sameAs: [r.homepage] } : {}),
              interactionStatistic: [
                { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: r.stars, name: "GitHub stars" },
                { "@type": "InteractionCounter", interactionType: "https://schema.org/ShareAction", userInteractionCount: r.forks, name: "GitHub forks" },
              ],
            },
            { "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "ideas", item: SITE.url },
                { "@type": "ListItem", position: 2, name: c.name, item: `${SITE.url}/c/${c.slug}` },
                { "@type": "ListItem", position: 3, name: r.fullName, item: `${SITE.url}${path}` },
              ],
            },
          ],
        }}
      />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">ideas</Link> <span>/</span> <Link href={`/c/${c.slug}`}>{c.name}</Link> <span>/</span> <span style={{ color: "var(--text-2)" }}>{r.fullName}</span>
      </nav>

      <article className="panel">
        <header className="detail-title">
          <Avatar src={r.avatar} alt={`${r.owner} avatar`} lg />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>
              <span>{r.owner}/</span>
              {r.name}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
              <span className="kbd">★ {r.stars.toLocaleString("en-US")}</span>
              {r.language && <span className="kbd">{r.language}</span>}
              {r.license && <span className="kbd">{r.license}</span>}
              {r.archived && <span className="kbd kbd-accent">archived</span>}
              <Vibe v={r.vibe} />
            </div>
          </div>
        </header>
        <p className="lede">{r.description || "No description provided."}</p>

        {r.note && (
          <div style={{ padding: "0 18px 16px" }}>
            <div className="note"><b>Curator’s note:</b> {r.note}</div>
          </div>
        )}

        <div className="panel-pad" style={{ borderTop: "1px solid var(--line-soft)" }}>
          <h2 className="h" style={{ marginBottom: 8 }}>What it is</h2>
          <div className="prose"><p>{r.readme || r.description}</p></div>
          <h2 className="h" style={{ margin: "16px 0 8px" }}>When to use it</h2>
          <div className="prose"><p>{useWhenSentence(r)}</p></div>
        </div>

        <dl className="meta" style={{ margin: 0, borderTop: "1px solid var(--line-soft)" }}>
          <div><dt>Category</dt><dd><Link href={`/c/${c.slug}`}>{c.name}</Link></dd></div>
          <div><dt>Also in</dt><dd>{r.categories.slice(1).map((s) => getCategory(s).name).join(", ") || "—"}</dd></div>
          <div><dt>Stars</dt><dd>{r.stars.toLocaleString("en-US")}</dd></div>
          <div><dt>Forks</dt><dd>{r.forks.toLocaleString("en-US")}</dd></div>
          <div><dt>Last push</dt><dd title={r.pushedAt}>{ago(r.pushedAt)}</dd></div>
          <div><dt>Created</dt><dd>{r.createdAt.slice(0, 10)}</dd></div>
          <div><dt>Open issues</dt><dd>{r.openIssues.toLocaleString("en-US")}</dd></div>
          <div><dt>Website</dt><dd>{r.homepage ? <a href={r.homepage} rel="nofollow noopener" target="_blank">{r.homepage.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a> : "—"}</dd></div>
        </dl>

        <div className="panel-pad">
          <div className="chips">
            {r.tags.map((t) => <Link key={t} href={`/t/${t}`} className="chip">#{t}</Link>)}
          </div>
        </div>

        <div className="panel-pad" style={{ borderTop: "1px solid var(--line-soft)" }}>
          <h2 className="h" style={{ marginBottom: 8 }}>Quick start</h2>
          <div className="code" style={{ paddingRight: 70 }}>
            <span className="a">$</span> {clone}
            <CopyButton text={clone} msg="Clone command copied" />
          </div>
          <h2 className="h" style={{ margin: "16px 0 8px" }}>Hand it to your AI</h2>
          <div className="code code-wrap" style={{ paddingRight: 70 }}>
            {aiPrompt}
            <CopyButton text={aiPrompt} msg="Prompt copied" />
          </div>
        </div>

        <div className="actionbar">
          <span className="left">
            <CatIcon color={c.color} glyph={c.glyph} />
            <span>{c.name}</span>
          </span>
          <span className="right">
            <a className="act hide-sm" href={`${path}.md`}>Markdown <span className="kbd">.md</span></a>
            <span className="sep hide-sm" />
            <a className="act" href={r.url} target="_blank" rel="noopener">Open on GitHub <span className="kbd">↵</span></a>
          </span>
        </div>
      </article>

      {alts.length > 0 && (
        <section className="panel stack-gap" aria-labelledby="alt-h">
          <div className="section-title" style={{ padding: "14px 18px 4px" }}>
            <h2 id="alt-h" className="h">Alternatives to {r.name}</h2>
            <Link href={`/c/${c.slug}`}>All {c.name} →</Link>
          </div>
          <div className="panel-body">{alts.map((a) => <RepoRow key={a.id} r={a} />)}</div>
        </section>
      )}

      {rel.length > 0 && (
        <section className="panel stack-gap" aria-labelledby="rel-h">
          <div className="section-title" style={{ padding: "14px 18px 4px" }}>
            <h2 id="rel-h" className="h">Pairs well with</h2>
          </div>
          <div className="panel-body">{rel.map((a) => <RepoRow key={a.id} r={a} />)}</div>
        </section>
      )}

      <section className="panel stack-gap faq" aria-labelledby="faq-h">
        <div className="section-title" style={{ padding: "14px 18px 4px" }}>
          <h2 id="faq-h" className="h">FAQ</h2>
        </div>
        <div className="panel-body">
          {faq.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

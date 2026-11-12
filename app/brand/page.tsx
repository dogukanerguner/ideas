import type { Metadata } from "next";
import Link from "next/link";
import { Mark, Wordmark } from "@/components/brand/Logo";
import IdiLive from "@/components/brand/IdiLive";
import type { IdiAccessory, IdiPose } from "@/components/brand/Idi";

export const metadata: Metadata = {
  title: "Brand — logo, colours and İdi the mascot",
  description: "The ideas logo, wordmark, colours and mascot İdi. Free to use when you link to or write about ideas.",
  alternates: { canonical: "/brand" },
};

const COLORS: [string, string, string][] = [["Coral", "#ff6363", "accent, the keycap"], ["Ember", "#e2444f", "keycap shade"], ["Ink", "#1a0b0b", "the i, text on coral"], ["Spark", "#ffd166", "İdi's lit idea"], ["Night", "#12131a", "background"], ["Paper", "#f6f1ea", "light background"]];
const FILES: [string, string][] = [["Mark (SVG)", "/brand/mark.svg"], ["Mark 1024 (PNG)", "/brand/mark-1024.png"], ["Mark, flat", "/brand/mark-flat.svg"], ["Mark, mono ink", "/brand/mark-mono-ink.svg"], ["Mark, mono white", "/brand/mark-mono-white.svg"], ["Wordmark on dark", "/brand/wordmark-on-dark.svg"], ["Wordmark on light", "/brand/wordmark-on-light.svg"], ["Lockup on dark (SVG)", "/brand/lockup-on-dark.svg"], ["Lockup on dark (PNG)", "/brand/lockup-on-dark.png"], ["Lockup on light (SVG)", "/brand/lockup-on-light.svg"], ["Lockup on light (PNG)", "/brand/lockup-on-light.png"], ["Social preview 1280×640", "/brand/social-preview.png"]];
const CAST: [IdiPose, IdiAccessory, string][] = [["wave", "none", "Hi"], ["think", "none", "Searching"], ["type", "headset", "Building"], ["shock", "none", "Almost!"], ["celebrate", "party", "Found it"], ["dance", "none", "Vibing"]];

export default function BrandPage() {
  return (
    <main className="wrap wrap-wide">
      <nav className="crumbs"><Link href="/">ideas</Link> <span>/</span> <span>Brand</span></nav>
      <section className="panel panel-pad">
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <Mark size={88} title="ideas" />
          <Wordmark height={64} />
        </div>
        <p className="lede" style={{ marginTop: 18 }}>
          The mark is the <b>i</b> of ideas on a launcher keycap: the stem is a command-line caret, the dot is the <b>idea spark ✦</b>. Coral keycap, ink glyph, plenty of room around it. Don&apos;t recolour, stretch, outline or rotate it.
        </p>
      </section>

      <section className="panel panel-pad stack-gap">
        <div className="section-title" style={{ padding: "0 0 10px" }}>Meet İdi</div>
        <p className="muted" style={{ marginTop: 0 }}>İdi is the same i, alive. When it has an idea, the spark lights up. You&apos;ll see it in every VaybKod video too.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {CAST.map(([pose, acc, label]) => (
            <figure key={pose} style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 0", background: "var(--fill-soft)", borderRadius: 12 }}>
              <IdiLive pose={pose} accessory={acc} size={150} />
              <figcaption className="muted" style={{ fontSize: 12.5 }}>{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="panel panel-pad stack-gap">
        <div className="section-title" style={{ padding: "0 0 10px" }}>Colours</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {COLORS.map(([n, hex, use]) => (
            <div key={hex} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--line-soft)" }}>
              <div style={{ height: 64, background: hex }} />
              <div style={{ padding: "8px 10px" }}><b>{n}</b> <span className="mono muted">{hex}</span><div className="muted" style={{ fontSize: 12 }}>{use}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-pad stack-gap">
        <div className="section-title" style={{ padding: "0 0 10px" }}>Downloads</div>
        <div className="chips">{FILES.map(([n, f]) => <a key={f} className="chip" href={f} download>{n} ↓</a>)}</div>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 0 }}>Free to use when linking to or writing about ideas. Everything is generated from <code>scripts/brand.mjs</code>.</p>
      </section>
    </main>
  );
}

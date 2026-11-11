import type { CSSProperties } from "react";

export function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function Avatar({ src, alt, lg }: { src: string; alt: string; lg?: boolean }) {
  return (
    <span className={`ico${lg ? " ico-lg" : ""}`} style={{ background: "#2a2b33" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${src}${src.includes("?") ? "&" : "?"}s=${lg ? 96 : 60}`} alt={alt} width={lg ? 48 : 30} height={lg ? 48 : 30} loading="lazy" decoding="async" />
    </span>
  );
}

export function CatIcon({ color, glyph, lg }: { color: string; glyph: string; lg?: boolean }) {
  const style: CSSProperties = { background: `linear-gradient(150deg, ${color}, color-mix(in srgb, ${color} 70%, #000))` };
  return (
    <span className={`ico ico-cat${lg ? " ico-lg" : ""}`} style={style} aria-hidden>
      {glyph}
    </span>
  );
}

export function CmdIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="ico ico-cmd" aria-hidden>
      {children}
    </span>
  );
}

export function Vibe({ v }: { v: number }) {
  return (
    <span className="vibe" title={`Vibe score ${v}/100 — popularity + freshness + hygiene`}>
      <span className="bar">
        <i style={{ width: `${v}%` }} />
      </span>
      <b>{v}</b>
    </span>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

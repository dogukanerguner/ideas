/* ideas logo, inline (no request, crisp at any size). Source of truth: scripts/brand.mjs */
const spark = (cx: number, cy: number, r: number) => {
  const k = 0.14, m = 0.3;
  return `M${cx} ${cy - r} C${cx + r * k} ${cy - r * m} ${cx + r * m} ${cy - r * k} ${cx + r} ${cy} C${cx + r * m} ${cy + r * k} ${cx + r * k} ${cy + r * m} ${cx} ${cy + r} C${cx - r * k} ${cy + r * m} ${cx - r * m} ${cy + r * k} ${cx - r} ${cy} C${cx - r * m} ${cy - r * k} ${cx - r * k} ${cy - r * m} ${cx} ${cy - r}Z`;
};

export function Mark({ size = 24, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs><linearGradient id="ideas-mark-g" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stopColor="#ff8a6b" /><stop offset="1" stopColor="#e2444f" /></linearGradient></defs>
      <rect width="64" height="64" rx="16" fill="url(#ideas-mark-g)" />
      <rect x="1.5" y="1.5" width="61" height="61" rx="14.5" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1.5" />
      <rect x="25.5" y="30" width="13" height="25" rx="6.5" fill="#1a0b0b" />
      <path d={spark(32, 17.5, 10.5)} fill="#1a0b0b" />
    </svg>
  );
}

export function Wordmark({ height = 18, color = "currentColor", spark: sc = "#ff6363" }: { height?: number; color?: string; spark?: string }) {
  const st = { fill: "none", stroke: color, strokeWidth: 14, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg height={height} width={(height * 300) / 110} viewBox="-8 2 300 110" aria-hidden>
      <path d={spark(7, 20, 12)} fill={sc} />
      <line x1="7" y1="47" x2="7" y2="93" {...st} />
      <circle cx="56" cy="70" r="23" {...st} /><line x1="79" y1="17" x2="79" y2="93" {...st} />
      <path d="M105 70 H151 A23 23 0 1 0 144.3 86.3" {...st} />
      <circle cx="200" cy="70" r="23" {...st} /><line x1="223" y1="47" x2="223" y2="93" {...st} />
      <path d="M283 54 C279 47 270 46 263 46 C253 46 248 52 249 58 C250 66 259 68 267 70 C277 72 285 75 285 83 C285 90 278 94 268 94 C259 94 251 91 247 85" {...st} />
    </svg>
  );
}

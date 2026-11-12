// ideas brand kit, generated from code (reproducible):  node scripts/brand.mjs
// The mark is the "i" of ideas: a launcher keycap (coral) with a command-line stem and the idea spark ✦ as its dot.
// The wordmark is custom monoline lettering (no font needed anywhere). Mascot İdi = the same i, alive.
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public", "brand");
mkdirSync(OUT, { recursive: true });

export const C = { coral: "#ff6363", coral2: "#ff8a6b", deep: "#e2444f", ink: "#1a0b0b", night: "#12131a", night2: "#1a1b23", paper: "#f6f1ea", spark: "#ffd166", text: "#f2f2f5" };

/** 4-point idea spark centred on (cx, cy) */
const spark = (cx, cy, r) => {
  const k = 0.14, m = 0.3;
  return `M${cx} ${cy - r} C${cx + r * k} ${cy - r * m} ${cx + r * m} ${cy - r * k} ${cx + r} ${cy} C${cx + r * m} ${cy + r * k} ${cx + r * k} ${cy + r * m} ${cx} ${cy + r} C${cx - r * k} ${cy + r * m} ${cx - r * m} ${cy + r * k} ${cx - r} ${cy} C${cx - r * m} ${cy - r * k} ${cx - r * k} ${cy - r * m} ${cx} ${cy - r}Z`;
};

/* ------------------------------ the mark ------------------------------ */
function mark({ size = 512, flat = false, mono = null, padding = 0, bg = null } = {}) {
  // 64-unit grid
  const body = mono ?? "url(#g)";
  const glyph = mono ? (mono === C.ink ? C.paper : C.ink) : C.ink;
  const p = padding;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-p} ${-p} ${64 + 2 * p} ${64 + 2 * p}">
  ${bg ? `<rect x="${-p}" y="${-p}" width="${64 + 2 * p}" height="${64 + 2 * p}" fill="${bg}"/>` : ""}
  <defs><linearGradient id="g" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="${C.coral2}"/><stop offset="1" stop-color="${C.deep}"/></linearGradient></defs>
  <rect width="64" height="64" rx="16" fill="${body}"/>
  ${flat || mono ? "" : `<rect x="1.5" y="1.5" width="61" height="61" rx="14.5" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.5"/><path d="M8 12 Q8 6 14 6 H50" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`}
  <rect x="25.5" y="30" width="13" height="25" rx="6.5" fill="${glyph}"/>
  <path d="${spark(32, 17.5, 10.5)}" fill="${glyph}"/>
</svg>`;
}

/* ---------------------------- the wordmark ---------------------------- */
// monoline, round caps, x-height 60 units, stroke 14; letters: i d e a s
function wordmark({ color = C.text, sparkColor = C.coral, height = 120 } = {}) {
  const sw = 14;
  const st = `fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  const parts = [
    `<path d="${spark(7, 20, 12)}" fill="${sparkColor}"/>`, // i dot = spark
    `<line x1="7" y1="47" x2="7" y2="93" ${st}/>`, // i
    `<circle cx="56" cy="70" r="23" ${st}/><line x1="79" y1="17" x2="79" y2="93" ${st}/>`, // d
    `<path d="M105 70 H151 A23 23 0 1 0 144.3 86.3" ${st}/>`, // e
    `<circle cx="200" cy="70" r="23" ${st}/><line x1="223" y1="47" x2="223" y2="93" ${st}/>`, // a
    `<path d="M283 54 C279 47 270 46 263 46 C253 46 248 52 249 58 C250 66 259 68 267 70 C277 72 285 75 285 83 C285 90 278 94 268 94 C259 94 251 91 247 85" ${st}/>`, // s
  ];
  const vbW = 300, vbH = 110;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${(height * vbW) / vbH}" height="${height}" viewBox="-8 2 ${vbW} ${vbH}">${parts.join("")}</svg>`;
}

function lockup({ dark = true, height = 160 } = {}) {
  const color = dark ? C.text : C.ink;
  const m = mark({ size: 100 }).replace(/<svg[^>]*>/, "").replace("</svg>", "");
  const w = wordmark({ color }).replace(/<svg[^>]*>/, "").replace("</svg>", "");
  return `<svg xmlns="http://www.w3.org/2000/svg" height="${height}" width="${(height * 440) / 110}" viewBox="0 0 440 110">
  <g transform="translate(0 5) scale(1.5625)">${m}</g>
  <g transform="translate(128 0)"><svg viewBox="-8 2 300 110" width="300" height="110">${w}</svg></g>
</svg>`;
}

const write = (name, svg) => { writeFileSync(join(OUT, name), svg); return svg; };
const png = (svg, file, w, h) => sharp(Buffer.from(svg), { density: 384 }).resize(w, h ?? w).png().toFile(file);

// SVG sources
write("mark.svg", mark());
write("mark-flat.svg", mark({ flat: true }));
write("mark-mono-ink.svg", mark({ mono: C.ink }));
write("mark-mono-white.svg", mark({ mono: "#ffffff" }));
write("wordmark-on-dark.svg", wordmark({ color: C.text }));
write("wordmark-on-light.svg", wordmark({ color: C.ink }));
write("lockup-on-dark.svg", lockup({ dark: true }));
write("lockup-on-light.svg", lockup({ dark: false }));

// app icons
writeFileSync(join(root, "app", "icon.svg"), mark({ size: 64 }));
await png(mark({ size: 512 }), join(root, "app", "apple-icon.png"), 180);
await png(mark({ size: 512 }), join(root, "public", "icon-192.png"), 192);
await png(mark({ size: 512 }), join(root, "public", "icon-512.png"), 512);
// maskable: full-bleed background, mark inside the 80 % safe zone
await png(mark({ size: 512, padding: 10, bg: C.night }), join(root, "public", "icon-maskable-512.png"), 512);

// favicon.ico with 16/32/48 PNG frames (crisper flat mark at small sizes)
const frames = await Promise.all([16, 32, 48].map((s) => sharp(Buffer.from(mark({ size: 256, flat: true })), { density: 384 }).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((buf, i) => {
  const s = [16, 32, 48][i], o = 6 + i * 16;
  header.writeUInt8(s, o); header.writeUInt8(s, o + 1); header.writeUInt8(0, o + 2); header.writeUInt8(0, o + 3);
  header.writeUInt16LE(1, o + 4); header.writeUInt16LE(32, o + 6); header.writeUInt32LE(buf.length, o + 8); header.writeUInt32LE(offset, o + 12);
  offset += buf.length;
});
writeFileSync(join(root, "app", "favicon.ico"), Buffer.concat([header, ...frames]));

// raster logos for docs, press and social
await png(lockup({ dark: true, height: 220 }), join(OUT, "lockup-on-dark.png"), 880, 220);
await png(lockup({ dark: false, height: 220 }), join(OUT, "lockup-on-light.png"), 880, 220);
await png(mark({ size: 1024 }), join(OUT, "mark-1024.png"), 1024);

// GitHub social preview 1280×640 (upload: repo Settings → Social preview)
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640">
  <defs><radialGradient id="r" cx="0.5" cy="0" r="0.8"><stop offset="0" stop-color="${C.coral}" stop-opacity=".22"/><stop offset="1" stop-color="${C.coral}" stop-opacity="0"/></radialGradient>
  <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night2}"/><stop offset="1" stop-color="${C.night}"/></linearGradient></defs>
  <rect width="1280" height="640" fill="url(#b)"/><rect width="1280" height="640" fill="url(#r)"/>
  <g transform="translate(250 190)">${lockup({ dark: true, height: 195 }).replace(/<svg[^>]*>/, '<svg viewBox="0 0 440 110" width="780" height="195">')}</g>
  <text x="640" y="470" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="${C.text}" fill-opacity=".62">The repo launcher for vibecoders · ideas.asveas.com</text>
</svg>`;
write("social-preview.svg", social);
await png(social, join(OUT, "social-preview.png"), 1280, 640);
console.log("brand kit →", OUT);

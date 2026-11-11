import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

type Row = { title: string; sub?: string; right?: string; color?: string; selected?: boolean };

/** A command-palette panel rendered as an image. */
const ascii = (s?: string) => (s ?? "").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();

export function paletteOg(input: { query: string; rows: Row[]; footer: string }) {
  const query = ascii(input.query);
  const footer = ascii(input.footer);
  const rows = input.rows.map((r) => ({ ...r, title: ascii(r.title), sub: ascii(r.sub), right: ascii(r.right) }));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,#1a1b23,#12131a)", fontFamily: "sans-serif" }}>
        <div style={{ position: "absolute", top: -200, left: 300, width: 600, height: 400, borderRadius: 400, background: "rgba(255,99,99,0.10)", filter: "blur(80px)", display: "flex" }} />
        <div style={{ width: 960, display: "flex", flexDirection: "column", background: "#1e1f26", border: "1px solid rgba(255,255,255,.14)", borderRadius: 22, boxShadow: "0 40px 120px rgba(0,0,0,.6)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", height: 104, padding: "0 36px", borderBottom: "1px solid rgba(255,255,255,.08)", fontSize: 40, color: "#f2f2f5", letterSpacing: -1 }}>
            <div style={{ width: 14, height: 46, background: "#ff6363", borderRadius: 3, marginRight: 22, display: "flex" }} />
            <div style={{ display: "flex", flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>{query}</div>
            <div style={{ display: "flex", fontSize: 24, color: "rgba(242,242,245,.55)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 8, padding: "4px 12px" }}>/</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "14px 18px" }}>
            {rows.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", height: 78, padding: "0 18px", borderRadius: 14, background: r.selected ? "rgba(255,255,255,.08)" : "transparent", position: "relative" }}>
                {r.selected && <div style={{ position: "absolute", left: 0, top: 16, bottom: 16, width: 6, background: "#ff6363", borderRadius: 4, display: "flex" }} />}
                <div style={{ width: 46, height: 46, borderRadius: 12, background: r.color ?? "#34353f", marginRight: 22, display: "flex" }} />
                <div style={{ display: "flex", fontSize: 30, color: "#f2f2f5", fontWeight: 600, marginRight: 18, whiteSpace: "nowrap" }}>{r.title}</div>
                <div style={{ display: "flex", flex: 1, fontSize: 25, color: "rgba(242,242,245,.55)", overflow: "hidden", whiteSpace: "nowrap" }}>{r.sub ?? ""}</div>
                {r.right && <div style={{ display: "flex", fontSize: 22, color: "rgba(242,242,245,.7)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 8, padding: "4px 12px", marginLeft: 16 }}>{r.right}</div>}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, padding: "0 32px", borderTop: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.2)", fontSize: 22, color: "rgba(242,242,245,.55)" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "#ff6363", marginRight: 12, display: "flex" }} />
              {footer}
            </div>
            <div style={{ display: "flex" }}>Open  |  Actions</div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

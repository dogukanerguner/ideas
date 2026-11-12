/* İdi — the ideas mascot. The "i" of the ideas logo come alive: a coral rounded stem (body) with the idea spark ✦
   floating above its head (the dot of the i). Fully procedural SVG, deterministic, driven by a local time `lt`.

   <Idi pose="wave" lt={c.lt} size={420} />            size = rendered height in px (body + spark)
   poses: idle · wave · point · jump · celebrate · think · shock · sad · walk · run · dance · type · present · peek · nod · shrug · facepalm · sneak · spin
   props: look [-1..1, -1..1] (eyes), dir 1|-1 (facing / pointing side), accessory, tint, outline (ink line for paper/flat worlds),
          spark: "lit" | "dim" | "off" | "burst", mouth override, blush, shadow
   Every pose loops forever, so it can sit on screen for a whole line. Mix poses by swapping `pose` per line or per beat. */
import React from "react";

export type IdiPose =
  | "idle" | "wave" | "point" | "jump" | "celebrate" | "think" | "shock" | "sad" | "walk" | "run" | "dance" | "type"
  | "present" | "peek" | "nod" | "shrug" | "facepalm" | "sneak" | "spin";
export type IdiAccessory =
  | "none" | "tophat" | "beret" | "headset" | "crown" | "detective" | "chef" | "helmet" | "glasses" | "bowtie" | "cap"
  | "wizard" | "party" | "scarf" | "visor" | "monocle" | "flower" | "bandana";
export type IdiProps = {
  pose?: IdiPose; lt: number; size?: number; look?: [number, number]; dir?: 1 | -1;
  accessory?: IdiAccessory | IdiAccessory[]; tint?: string; tint2?: string; outline?: string; spark?: "lit" | "dim" | "off" | "burst";
  mouth?: "smile" | "grin" | "o" | "flat" | "worried" | "tongue" | "smirk"; blush?: boolean; shadow?: boolean; style?: React.CSSProperties;
};

export const IDI = { coral: "#ff6363", coral2: "#ff8a6b", deep: "#e2444f", ink: "#1a0b0b", spark: "#ffd166", spark2: "#fff3c4", cheek: "#ff9aa2" };

const TAU = Math.PI * 2;
const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const s01 = (x: number) => 0.5 + 0.5 * Math.sin(x);
const hop = (ph: number) => Math.max(0, Math.sin(ph)); // 0..1 arc
const bounce = (u: number) => Math.abs(Math.sin(u * Math.PI)); // 0..1..0

/* pose → skeleton parameters at time lt */
export type Rig = {
  y: number; lean: number; sq: number; armL: number; armR: number; elbowL: number; elbowR: number; legL: number; legR: number;
  eyes: number; lookX: number; lookY: number; mouth: NonNullable<IdiProps["mouth"]>; spark: NonNullable<IdiProps["spark"]>;
  sparkSpin: number; sparkScale: number; shake: number; sweat: number; spinY: number; extra?: "dots" | "zz" | "hearts" | "bang" | "notes";
};

export function rig(pose: IdiPose, t: number, dir: number): Rig {
  const blinkCycle = (t * 0.37 + 0.13) % 1;
  const blink = blinkCycle > 0.965 ? 0.08 : 1;
  const breathe = Math.sin(t * 2.4) * 0.025;
  const base: Rig = { y: 0, lean: 0, sq: breathe, armL: 20 + Math.sin(t * 1.7) * 6, armR: -20 - Math.sin(t * 1.7 + 1) * 6, elbowL: 10, elbowR: -10, legL: 0, legR: 0, eyes: blink, lookX: Math.sin(t * 0.7) * 0.25, lookY: 0, mouth: "smile", spark: "lit", sparkSpin: t * 30, sparkScale: 1 + Math.sin(t * 3) * 0.06, shake: 0, sweat: 0, spinY: 0 };
  switch (pose) {
    case "idle": return { ...base, y: Math.sin(t * 2.4) * 4 };
    case "wave": return { ...base, y: Math.sin(t * 2.4) * 4, armR: -150 + Math.sin(t * 14) * 28, elbowR: -30 + Math.sin(t * 14) * 25, mouth: "grin", lean: Math.sin(t * 3) * 3 };
    case "point": return { ...base, armR: -92, elbowR: 0, lean: 6, lookX: 0.9, mouth: "smirk", y: Math.sin(t * 5) * 3, sparkScale: 1.1 + Math.sin(t * 6) * 0.08 };
    case "jump": { const ph = (t * 1.6) % 1; const air = bounce(cl(ph / 0.7)); const land = ph > 0.7 ? Math.sin(((ph - 0.7) / 0.3) * Math.PI) : 0;
      return { ...base, y: air * 120, sq: -air * 0.12 + land * 0.22 + (ph < 0.08 ? 0.18 * (1 - ph / 0.08) : 0), armL: 150 * air + 20, armR: -150 * air - 20, legL: -20 * air, legR: 20 * air, mouth: air > 0.3 ? "o" : "grin", lookY: -0.3 * air, sparkSpin: t * 240 }; }
    case "celebrate": { const ph = (t * 2.1) % 1; const air = bounce(cl(ph / 0.75));
      return { ...base, y: air * 90, sq: -air * 0.1 + (ph > 0.75 ? 0.18 * Math.sin(((ph - 0.75) / 0.25) * Math.PI) : 0), armL: 160 + Math.sin(t * 18) * 14, armR: -160 - Math.sin(t * 18 + 1) * 14, elbowL: 20, elbowR: -20, legL: -25 * air, legR: 25 * air, mouth: "grin", spark: "burst", sparkSpin: t * 360, sparkScale: 1.3 + Math.sin(t * 12) * 0.15, extra: "hearts" }; }
    case "think": return { ...base, armR: 30, elbowR: 120, armL: 25, lookX: -0.5, lookY: -0.8, mouth: "flat", lean: -3 + Math.sin(t * 1.2) * 2, spark: Math.sin(t * 9) > 0.2 ? "lit" : "dim", sparkScale: 0.85 + s01(t * 9) * 0.3, extra: "dots" };
    case "shock": { const k = Math.exp(-((t % 2.4) * 3)); return { ...base, y: 30 * k, sq: -0.14 * k, armL: 120, armR: -120, elbowL: 50, elbowR: -50, eyes: 1.35, lookX: 0, lookY: 0, mouth: "o", shake: 7 * (0.4 + k), sweat: 1, lean: -8 * dir, spark: "dim", extra: "bang" }; }
    case "sad": return { ...base, y: -4, sq: 0.05, armL: 8, armR: -8, elbowL: 5, elbowR: -5, eyes: 0.7, lookY: 0.6, lookX: 0, mouth: "worried", lean: Math.sin(t) * 1.5, spark: "dim", sparkScale: 0.8, sweat: 0.6 };
    case "walk": case "run": case "sneak": {
      const f = pose === "run" ? 9 : pose === "sneak" ? 3.6 : 6; const ph = t * f; const amp = pose === "run" ? 38 : pose === "sneak" ? 18 : 26;
      return { ...base, y: Math.abs(Math.sin(ph)) * (pose === "run" ? 16 : 8) + (pose === "sneak" ? -10 : 0), sq: pose === "sneak" ? 0.1 : 0, lean: (pose === "run" ? 12 : pose === "sneak" ? 8 : 4) * dir, legL: Math.sin(ph) * amp, legR: -Math.sin(ph) * amp, armL: 25 - Math.sin(ph) * amp, armR: -25 - Math.sin(ph) * amp, lookX: 0.6 * dir, mouth: pose === "sneak" ? "smirk" : pose === "run" ? "o" : "smile", eyes: pose === "sneak" ? 0.55 : base.eyes, sparkSpin: t * (pose === "run" ? 200 : 60) };
    }
    case "dance": { const ph = t * 4.2; return { ...base, y: Math.abs(Math.sin(ph)) * 18, lean: Math.sin(ph) * 10, sq: Math.abs(Math.cos(ph)) * 0.07, armL: 120 + Math.sin(ph) * 40, armR: -60 + Math.sin(ph + Math.PI) * 50, elbowL: 40, elbowR: -60, legL: Math.max(0, Math.sin(ph)) * 30, legR: -Math.max(0, -Math.sin(ph)) * 30, mouth: "grin", lookX: Math.sin(ph) * 0.6, sparkSpin: t * 180, extra: "notes" }; }
    case "type": { const ph = t * 16; return { ...base, y: Math.sin(t * 8) * 2, armL: 70 + Math.sin(ph) * 10, armR: -70 - Math.sin(ph + 1.7) * 10, elbowL: 60, elbowR: -60, lookY: 0.55, lookX: Math.sin(t * 2) * 0.3, mouth: "flat", lean: 4, sparkSpin: t * 120, sparkScale: 1 + s01(ph) * 0.1 }; }
    case "present": { const u = cl((t % 3) / 0.4); return { ...base, y: 10 * bounce(cl(t / 0.5)), armL: 40 + 85 * u, armR: -40 - 85 * u, elbowL: -20, elbowR: 20, mouth: "grin", spark: "burst", sparkScale: 1.2 + Math.sin(t * 6) * 0.1 }; }
    case "peek": return { ...base, y: -60 + Math.sin(t * 1.5) * 10, armL: 100, armR: -100, elbowL: 80, elbowR: -80, lookX: Math.sin(t * 1.3) * 0.9, eyes: base.eyes * 1.1, mouth: "smirk" };
    case "nod": return { ...base, lean: 0, sq: Math.max(0, Math.sin(t * 7)) * 0.08, y: -Math.max(0, Math.sin(t * 7)) * 6, lookY: 0.2 + Math.max(0, Math.sin(t * 7)) * 0.5, mouth: "smile" };
    case "shrug": { const u = s01(t * 3); return { ...base, armL: 70 + 30 * u, armR: -70 - 30 * u, elbowL: -70, elbowR: 70, mouth: "smirk", y: u * 8, lookX: 0.4 * Math.sin(t * 1.5) }; }
    case "facepalm": return { ...base, armR: 140, elbowR: -46, armL: 15, eyes: 0.15, mouth: "worried", lean: -6, y: -3, spark: "dim", sweat: 0.8, shake: Math.sin(t * 20) * 1.5 };
    case "spin": return { ...base, y: 30 + Math.sin(t * 6) * 10, spinY: t * 540, armL: 100, armR: -100, mouth: "grin", sparkSpin: t * 400, spark: "burst" };
  }
}

const Spark: React.FC<{ r: number; mode: Rig["spark"]; spin: number; outline?: string; t: number }> = ({ r, mode, spin, outline, t }) => {
  if (mode === "off") return null;
  const d = `M0 ${-r} C${r * 0.12} ${-r * 0.3} ${r * 0.3} ${-r * 0.12} ${r} 0 C${r * 0.3} ${r * 0.12} ${r * 0.12} ${r * 0.3} 0 ${r} C${-r * 0.12} ${r * 0.3} ${-r * 0.3} ${r * 0.12} ${-r} 0 C${-r * 0.3} ${-r * 0.12} ${-r * 0.12} ${-r * 0.3} 0 ${-r}Z`;
  const dim = mode === "dim";
  return (
    <g transform={`rotate(${spin % 360})`}>
      {!dim && <circle r={r * 2.2} fill="url(#idi-glow)" opacity={0.75 + 0.25 * Math.sin(t * 7)} />}
      {mode === "burst" && Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * TAU, k = ((t * 1.8 + i * 0.13) % 1); return <line key={i} x1={Math.cos(a) * r * (1.3 + k)} y1={Math.sin(a) * r * (1.3 + k)} x2={Math.cos(a) * r * (1.7 + k * 1.6)} y2={Math.sin(a) * r * (1.7 + k * 1.6)} stroke={IDI.spark} strokeWidth={r * 0.18} strokeLinecap="round" opacity={1 - k} />; })}
      <path d={d} fill={dim ? "#c9a24a" : IDI.spark} stroke={outline ?? (dim ? "#8a6a24" : "#f0a92b")} strokeWidth={r * 0.12} strokeLinejoin="round" />
      {!dim && <path d={d} transform="scale(0.45)" fill={IDI.spark2} />}
    </g>
  );
};

const Accessory: React.FC<{ a: IdiAccessory; ink: string; topY: number; w: number }> = ({ a, ink, topY, w }) => {
  const hw = w / 2;
  switch (a) {
    case "tophat": return <g transform={`translate(0 ${topY + 6})`}><rect x={-hw * 0.95} y={-10} width={hw * 1.9} height={14} rx={6} fill={ink} /><rect x={-hw * 0.6} y={-78} width={hw * 1.2} height={72} rx={8} fill={ink} /><rect x={-hw * 0.6} y={-26} width={hw * 1.2} height={12} fill={IDI.coral} /></g>;
    case "beret": return <g transform={`translate(0 ${topY + 8})`}><ellipse cx={8} cy={-10} rx={hw * 0.95} ry={22} fill="#2b2b3a" /><circle cx={10} cy={-34} r={7} fill="#2b2b3a" /></g>;
    case "headset": return <g><path d={`M${-hw - 4} ${topY + 70} C${-hw - 4} ${topY - 26} ${hw + 4} ${topY - 26} ${hw + 4} ${topY + 70}`} fill="none" stroke={ink} strokeWidth={9} /><rect x={-hw - 16} y={topY + 52} width={22} height={40} rx={9} fill={ink} /><rect x={hw - 6} y={topY + 52} width={22} height={40} rx={9} fill={ink} /><path d={`M${-hw - 6} ${topY + 88} Q${-hw + 10} ${topY + 130} ${-hw * 0.2} ${topY + 126}`} fill="none" stroke={ink} strokeWidth={6} /><circle cx={-hw * 0.2} cy={topY + 126} r={8} fill={ink} /></g>;
    case "crown": return <path transform={`translate(0 ${topY + 6})`} d={`M${-hw * 0.7} 0 L${-hw * 0.7} -40 L${-hw * 0.35} -18 L0 -48 L${hw * 0.35} -18 L${hw * 0.7} -40 L${hw * 0.7} 0 Z`} fill="#ffcc33" stroke="#b8860b" strokeWidth={4} strokeLinejoin="round" />;
    case "detective": return <g transform={`translate(0 ${topY + 10})`}><ellipse cx={0} cy={-4} rx={hw * 1.15} ry={14} fill="#6b5236" /><path d={`M${-hw * 0.75} -4 C${-hw * 0.7} -60 ${hw * 0.7} -60 ${hw * 0.75} -4 Z`} fill="#7d6040" /><rect x={-hw * 0.75} y={-18} width={hw * 1.5} height={10} fill="#3a2a1a" /></g>;
    case "chef": return <g transform={`translate(0 ${topY + 8})`}><rect x={-hw * 0.7} y={-22} width={hw * 1.4} height={26} rx={6} fill="#fff" stroke="#ddd" strokeWidth={3} /><circle cx={-hw * 0.45} cy={-40} r={26} fill="#fff" /><circle cx={0} cy={-52} r={30} fill="#fff" /><circle cx={hw * 0.45} cy={-40} r={26} fill="#fff" /></g>;
    case "helmet": return <g transform={`translate(0 ${topY + 4})`}><path d={`M${-hw - 6} 30 C${-hw - 6} -46 ${hw + 6} -46 ${hw + 6} 30 Z`} fill="#ffd23f" stroke="#c99a00" strokeWidth={4} /><rect x={-hw - 14} y={24} width={w + 28} height={12} rx={6} fill="#ffd23f" stroke="#c99a00" strokeWidth={3} /></g>;
    case "cap": return <g transform={`translate(0 ${topY + 12})`}><path d={`M${-hw * 0.95} 0 C${-hw * 0.9} -50 ${hw * 0.9} -50 ${hw * 0.95} 0 Z`} fill="#2d6cdf" /><rect x={0} y={-8} width={hw * 1.6} height={12} rx={6} fill="#2d6cdf" /></g>;
    case "wizard": return <g transform={`translate(0 ${topY + 8})`}><ellipse cx={0} cy={0} rx={hw * 1.2} ry={14} fill="#4b2a8a" /><path d={`M${-hw * 0.7} 0 L${hw * 0.2} -120 L${hw * 0.7} 0 Z`} fill="#5b34a6" /><circle cx={hw * 0.2} cy={-120} r={8} fill={IDI.spark} /><text x={-10} y={-30} fontSize={26} fill={IDI.spark}>★</text></g>;
    case "party": return <g transform={`translate(0 ${topY + 6}) rotate(-12)`}><path d={`M${-hw * 0.45} 0 L0 -86 L${hw * 0.45} 0 Z`} fill="#3ec6ff" /><path d={`M${-hw * 0.3} -26 L${hw * 0.3} -26 M${-hw * 0.18} -52 L${hw * 0.18} -52`} stroke="#fff" strokeWidth={7} /><circle cx={0} cy={-90} r={10} fill="#ff4fd8" /></g>;
    case "visor": return <g transform={`translate(0 ${topY + 30})`}><rect x={-hw - 4} y={-6} width={w + 8} height={14} rx={7} fill="#111" /><path d={`M${-hw * 0.2} 8 L${hw * 1.5} 16 L${hw * 0.9} 2 Z`} fill="#22c55e" opacity={0.9} /></g>;
    case "bandana": return <g transform={`translate(0 ${topY + 22})`}><path d={`M${-hw - 4} 0 C${-hw} -40 ${hw} -40 ${hw + 4} 0 Z`} fill="#d62828" /><path d={`M${hw} -4 l26 -10 l-6 22 z`} fill="#d62828" /></g>;
    case "flower": return <g transform={`translate(${hw * 0.55} ${topY + 12})`}>{Array.from({ length: 5 }, (_, i) => <circle key={i} cx={Math.cos((i / 5) * TAU) * 12} cy={Math.sin((i / 5) * TAU) * 12} r={10} fill="#ff9ad5" />)}<circle r={8} fill="#ffd166" /></g>;
    default: return null;
  }
};

export const Idi: React.FC<IdiProps> = ({ pose = "idle", lt, size = 400, look, dir = 1, accessory = "none", tint, tint2, outline, spark, mouth, blush = true, shadow = true, style }) => {
  const R = rig(pose, lt, dir);
  const ink = IDI.ink;
  const line = outline;
  const lw = outline ? 6 : 0;
  // body box (feet at y=0, up is negative)
  const BW = 120, BH = 168, legH = 26;
  const sx = 1 + R.sq * 0.7, sy = 1 - R.sq;
  const bodyTop = -legH - BH;
  const lookX = look ? look[0] : R.lookX, lookY = look ? look[1] : R.lookY;
  const shakeX = R.shake ? Math.sin(lt * 70) * R.shake : 0;
  const spinK = R.spinY ? Math.cos((R.spinY * Math.PI) / 180) : 1;
  const accs = (Array.isArray(accessory) ? accessory : [accessory]).filter((a) => a !== "none");
  const HAT: Partial<Record<IdiAccessory, number>> = { tophat: 88, wizard: 132, party: 104, chef: 84, crown: 52, detective: 50, helmet: 38, cap: 40, beret: 42, bandana: 18, headset: 16 };
  const hatLift = Math.max(0, ...accs.map((a) => HAT[a] ?? 0));
  const c1 = tint ?? IDI.coral2, c2 = tint2 ?? IDI.deep;
  const gid = `idi-g-${(tint ?? "c").replace(/[^a-z0-9]/gi, "")}`;
  const eyeY = bodyTop + 62, eyeDX = 26;
  const mouthKind = mouth ?? R.mouth;
  const mY = bodyTop + 102;
  const mouthPath = {
    smile: `M-18 ${mY} Q0 ${mY + 18} 18 ${mY}`,
    grin: `M-24 ${mY - 4} Q0 ${mY + 30} 24 ${mY - 4} Z`,
    o: "",
    flat: `M-14 ${mY + 4} L14 ${mY + 4}`,
    worried: `M-18 ${mY + 10} Q0 ${mY - 6} 18 ${mY + 10}`,
    tongue: `M-22 ${mY - 2} Q0 ${mY + 26} 22 ${mY - 2} Z`,
    smirk: `M-16 ${mY + 4} Q6 ${mY + 14} 20 ${mY - 4}`,
  }[mouthKind];
  // arms from shoulders: angle 0 = straight down, positive = outward-left for L (mirrored for R)
  const arm = (side: -1 | 1, ang: number, elbow: number) => {
    const shX = side * (BW / 2 - 6), shY = bodyTop + 100;
    const a1 = (ang * Math.PI) / 180, a2 = ((ang + elbow) * Math.PI) / 180;
    const L1 = 46, L2 = 40; // angle 0 = hanging down; left arm raises with +, right arm with −
    const exx = shX - Math.sin(a1) * L1, ey = shY + Math.cos(a1) * L1;
    const hx = exx - Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2;
    return (
      <g>
        <path d={`M${shX} ${shY} L${exx} ${ey} L${hx} ${hy}`} fill="none" stroke={line ?? c2} strokeWidth={18 + lw} strokeLinecap="round" strokeLinejoin="round" />
        {line && <path d={`M${shX} ${shY} L${exx} ${ey} L${hx} ${hy}`} fill="none" stroke={c2} strokeWidth={18 - lw} strokeLinecap="round" strokeLinejoin="round" />}
        <circle cx={hx} cy={hy} r={13} fill={c1} stroke={line ?? c2} strokeWidth={line ? lw : 3} />
      </g>
    );
  };
  const leg = (side: -1 | 1, ang: number) => {
    const hx = side * 26, hy = -legH - 4;
    const a = (ang * Math.PI) / 180;
    const fx = hx + Math.sin(a) * legH, fy = hy + Math.cos(a) * (legH + 4);
    return (
      <g>
        <line x1={hx} y1={hy} x2={fx} y2={fy} stroke={line ?? c2} strokeWidth={20 + lw} strokeLinecap="round" />
        {line && <line x1={hx} y1={hy} x2={fx} y2={fy} stroke={c2} strokeWidth={20 - lw} strokeLinecap="round" />}
        <ellipse cx={fx + side * 6} cy={fy + 2} rx={20} ry={11} fill={ink} />
      </g>
    );
  };
  const extra = R.extra;
  const t = lt;
  // total height ≈ spark top (-legH-BH-70) … 0  → fit into `size`
  const H = legH + BH + 120 + hatLift, Wd = 360;
  return (
    <svg width={(size * Wd) / H} height={size} viewBox={`${-Wd / 2} ${-H + 10} ${Wd} ${H + 10}`} style={{ overflow: "visible", ...style }}>
      <defs>
        <radialGradient id="idi-glow"><stop offset="0" stopColor={IDI.spark} stopOpacity={0.75} /><stop offset="0.45" stopColor={IDI.spark} stopOpacity={0.25} /><stop offset="1" stopColor={IDI.spark} stopOpacity={0} /></radialGradient>
        <linearGradient id={gid} x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
      </defs>
      {shadow && <ellipse cx={0} cy={4} rx={70 * (1 - Math.min(0.5, R.y / 300))} ry={12 * (1 - Math.min(0.5, R.y / 300))} fill="#000" opacity={0.22 * (1 - Math.min(0.6, R.y / 200))} />}
      <g transform={`translate(${shakeX} ${-R.y}) rotate(${R.lean}) scale(${dir * spinK} 1)`}>
        <g transform={`scale(${sx} ${sy})`}>
          {leg(-1, R.legL)}{leg(1, R.legR)}
          {arm(-1, R.armL, R.elbowL)}
          {/* body: the stem of the i */}
          <rect x={-BW / 2} y={bodyTop} width={BW} height={BH} rx={BW / 2} fill={`url(#${gid})`} stroke={line ?? "none"} strokeWidth={lw} />
          <rect x={-BW / 2 + 16} y={bodyTop + 14} width={22} height={BH * 0.42} rx={11} fill="#fff" opacity={0.22} />
          {/* face (hidden when seen from behind during a spin) */}
          {spinK > 0 && (
            <g>
              {[-1, 1].map((s) => (
                <g key={s} transform={`translate(${s * eyeDX + lookX * 6} ${eyeY + lookY * 5}) scale(1 ${R.eyes})`}>
                  <ellipse rx={17} ry={21} fill="#fff" stroke={line ?? "none"} strokeWidth={line ? 4 : 0} />
                  <circle cx={lookX * 6} cy={lookY * 7} r={10} fill={ink} />
                  <circle cx={lookX * 6 + 4} cy={lookY * 7 - 4} r={3.6} fill="#fff" />
                </g>
              ))}
              {blush && <><ellipse cx={-44} cy={eyeY + 34} rx={12} ry={7} fill={IDI.cheek} opacity={0.75} /><ellipse cx={44} cy={eyeY + 34} rx={12} ry={7} fill={IDI.cheek} opacity={0.75} /></>}
              {mouthKind === "o" ? <ellipse cx={0} cy={mY + 6} rx={11} ry={14 + Math.sin(t * 9) * 2} fill={ink} /> :
                <path d={mouthPath} fill={mouthKind === "grin" || mouthKind === "tongue" ? ink : "none"} stroke={ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}
              {mouthKind === "grin" && <path d={`M-12 ${mY + 10} Q0 ${mY + 18} 12 ${mY + 10}`} fill="#ff8fa0" />}
              {mouthKind === "tongue" && <ellipse cx={4} cy={mY + 14} rx={9} ry={7} fill="#ff6f86" />}
              {accs.includes("glasses") && <g stroke={ink} strokeWidth={5} fill="rgba(255,255,255,.15)"><circle cx={-eyeDX} cy={eyeY} r={24} /><circle cx={eyeDX} cy={eyeY} r={24} /><line x1={-3} y1={eyeY} x2={3} y2={eyeY} /></g>}
              {accs.includes("monocle") && <g><circle cx={eyeDX} cy={eyeY} r={25} fill="none" stroke="#c9a24a" strokeWidth={5} /><path d={`M${eyeDX + 18} ${eyeY + 18} q10 40 -10 70`} fill="none" stroke="#c9a24a" strokeWidth={3} /></g>}
            </g>
          )}
          {accs.includes("bowtie") && <path d={`M0 ${bodyTop + 138} l-26 -14 v28 z M0 ${bodyTop + 138} l26 -14 v28 z`} fill="#1a0b0b" />}
          {accs.includes("scarf") && <g><rect x={-BW / 2 - 4} y={bodyTop + 120} width={BW + 8} height={20} rx={10} fill="#2a9d8f" /><rect x={BW / 2 - 30} y={bodyTop + 128} width={18} height={50} rx={8} fill="#2a9d8f" transform={`rotate(${Math.sin(t * 4) * 8} ${BW / 2 - 21} ${bodyTop + 128})`} /></g>}
          {accs.filter((a) => !["glasses", "monocle", "bowtie", "scarf"].includes(a)).map((a) => <Accessory key={a} a={a} ink={ink} topY={bodyTop} w={BW} />)}
          {arm(1, R.armR, R.elbowR)}
          {/* sweat drop */}
          {R.sweat > 0 && <path d={`M${BW / 2 + 6} ${bodyTop + 24 + ((t * 40) % 30)} q8 14 0 20 q-8 -6 0 -20z`} fill="#7cc8ff" opacity={R.sweat} />}
        </g>
        {/* the dot of the i: the idea spark, floating */}
        <g transform={`translate(${Math.sin(t * 2.2) * 4} ${bodyTop * sy - 46 - hatLift + Math.sin(t * 3) * 6}) scale(${R.sparkScale})`}>
          <Spark r={28} mode={spark ?? R.spark} spin={R.sparkSpin} outline={line} t={t} />
        </g>
        {extra === "dots" && [0, 1, 2].map((i) => <circle key={i} cx={-90 - i * 22} cy={bodyTop - 10 - i * 18} r={7 + i * 2} fill="#fff" opacity={s01(t * 5 - i)} stroke={ink} strokeWidth={2} />)}
        {extra === "bang" && <text x={BW / 2 + 16} y={bodyTop + 10} fontSize={64} fontWeight={900} fill="#ffd166" stroke={ink} strokeWidth={3} fontFamily="Arial Black, sans-serif">!</text>}
        {extra === "notes" && [0, 1].map((i) => { const k = (t * 0.8 + i * 0.5) % 1; return <text key={i} x={(i ? 1 : -1) * (80 + k * 30)} y={bodyTop + 20 - k * 120} fontSize={44} fill={ink} opacity={1 - k}>♪</text>; })}
        {extra === "hearts" && [0, 1, 2].map((i) => { const k = (t * 0.9 + i * 0.33) % 1; return <text key={i} x={(i - 1) * 70 + Math.sin(k * 9) * 10} y={bodyTop - 20 - k * 160} fontSize={40} fill="#ff4f6d" opacity={1 - k}>♥</text>; })}
      </g>
    </svg>
  );
};

/** small helper: pick a pose for a retention role, so every format gets lively defaults it can override */
export function poseFor(role: string, lt: number): IdiPose {
  switch (role) {
    case "commit": return lt % 2 < 1 ? "point" : "shrug";
    case "openloop": return "sneak";
    case "intro": return "wave";
    case "explain": return lt % 3 < 1.5 ? "present" : "nod";
    case "project": return "think";
    case "build": return "type";
    case "nearmiss": return "shock";
    case "recover": return "jump";
    case "sunk": return "run";
    case "ideas": return "point";
    case "cta": return "dance";
    case "reveal": return "celebrate";
    case "end": return "wave";
    default: return "idle";
  }
}

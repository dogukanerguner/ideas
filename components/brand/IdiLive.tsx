"use client";
/* İdi on the website: same mascot as the videos, animated with requestAnimationFrame; respects reduced motion. */
import { useEffect, useState } from "react";
import { Idi, type IdiProps } from "./Idi";

export default function IdiLive(p: Omit<IdiProps, "lt">) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0; const t0 = performance.now();
    const tick = (now: number) => { setT((now - t0) / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <Idi {...p} lt={t} />;
}

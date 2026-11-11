"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Palette from "./Palette";

/** ⌘K / Ctrl+K / "/" from anywhere: focuses the inline palette if the page has one, otherwise opens a modal. */
export default function GlobalPalette() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const trigger = () => {
      const inline = document.querySelector<HTMLInputElement>("[data-inline-palette] input");
      if (inline) {
        inline.focus();
        inline.closest("[data-inline-palette]")?.scrollIntoView({ block: "center", behavior: "smooth" });
      } else setOpen((o) => !o);
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        trigger();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        trigger();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("ideas:palette", trigger);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ideas:palette", trigger);
    };
  }, []);

  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)} role="dialog" aria-modal="true" aria-label="Command palette">
      <Palette modal onClose={() => setOpen(false)} />
    </div>
  );
}

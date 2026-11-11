"use client";

import { useState } from "react";

export function toast(msg: string) {
  if (typeof document === "undefined") return;
  document.querySelectorAll(".toast").forEach((n) => n.remove());
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.innerHTML = `<i></i>`;
  el.appendChild(document.createTextNode(msg));
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

export async function copyText(text: string, msg = "Copied to clipboard") {
  try {
    await navigator.clipboard.writeText(text);
    toast(msg);
  } catch {
    toast("Copy failed — select and copy manually");
  }
}

export function CopyButton({ text, label = "Copy", msg, className = "btn btn-sm copy" }: { text: string; label?: string; msg?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        copyText(text, msg);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

export function OpenPaletteButton() {
  return (
    <button type="button" className="kbtn" onClick={() => window.dispatchEvent(new Event("ideas:palette"))} aria-label="Open command palette">
      Search <span className="kbd">⌘K</span>
    </button>
  );
}

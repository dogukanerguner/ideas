"use client";
/* "My proposals": kept in this browser only, so people can always find what they submitted. */
import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { n: number; repo: string; state: string; at: number };
const KEY = "ideas:proposals";
const LABEL: Record<string, string> = { publishing: "being added", pending: "in review", live: "live", rejected: "not added", failed: "stuck" };

function read(): Item[] { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } }
export function rememberProposal(p: { n: number; repo: string; state: string }) {
  try {
    const all = read().filter((x) => x.n !== p.n);
    localStorage.setItem(KEY, JSON.stringify([{ ...p, at: Date.now() }, ...all].slice(0, 50)));
    window.dispatchEvent(new Event("ideas:proposals"));
  } catch {}
}

export default function MyProposals() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    const load = () => setItems(read());
    load(); window.addEventListener("ideas:proposals", load);
    return () => window.removeEventListener("ideas:proposals", load);
  }, []);
  if (!items.length) return null;
  return (
    <section className="panel panel-pad" style={{ marginTop: 16 }}>
      <div className="section-title" style={{ padding: "0 0 8px" }}>Your proposals (saved in this browser)</div>
      {items.map((x) => (
        <div key={x.n} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderTop: "1px solid var(--line-soft)" }}>
          <Link href={`/add/status/${x.n}`} style={{ textDecoration: "underline" }}>{x.repo}</Link>
          <span className="kbd">{LABEL[x.state] ?? x.state}</span>
        </div>
      ))}
    </section>
  );
}

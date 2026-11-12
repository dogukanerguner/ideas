import Link from "next/link";
import IdiLive from "@/components/brand/IdiLive";

export default function NotFound() {
  return (
    <main className="wrap" style={{ textAlign: "center", padding: "60px 16px" }}>
      <IdiLive pose="shrug" size={200} />
      <h1 style={{ marginTop: 10 }}>No idea here.</h1>
      <p className="muted">İdi looked everywhere. Try the search, or add the repo you were looking for.</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
        <Link className="btn btn-accent" href="/">Search ideas</Link>
        <Link className="btn" href="/add">Add a repo</Link>
      </div>
    </main>
  );
}

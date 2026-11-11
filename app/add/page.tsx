import type { Metadata } from "next";
import Link from "next/link";
import AddForm from "@/components/AddForm";

export const metadata: Metadata = {
  title: "Add a GitHub repo — auto-categorized in a second",
  description: "Paste a GitHub URL. ideas fetches the repo, reads its README and topics, then categorizes, tags and scores it automatically.",
  alternates: { canonical: "/add" },
};

type P = { searchParams: Promise<{ url?: string }> };

export default async function AddPage({ searchParams }: P) {
  const { url = "" } = await searchParams;
  const canPublish = Boolean(process.env.ADMIN_TOKEN && process.env.GITHUB_TOKEN);
  return (
    <main className="wrap wrap-wide">
      <nav className="crumbs"><Link href="/">ideas</Link> <span>/</span> <span>Add a repo</span></nav>
      <AddForm initialUrl={url} canPublish={canPublish} />
    </main>
  );
}

"use client";
/* Remembers the proposal in this browser ("my proposals") and refreshes the page while it is still moving. */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { rememberProposal } from "./MyProposals";

export default function ProposalWatch({ n, state, repo }: { n: number; state: string; repo: string | null }) {
  const router = useRouter();
  useEffect(() => { rememberProposal({ n, repo: repo ?? `#${n}`, state }); }, [n, repo, state]);
  useEffect(() => {
    if (state !== "publishing") return;
    const t = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(t);
  }, [state, router]);
  return null;
}

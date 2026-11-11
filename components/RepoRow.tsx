import Link from "next/link";
import type { RepoV } from "@/lib/data";
import { fmtStars } from "@/lib/data";
import { Avatar } from "./ui";

export default function RepoRow({ r, rank }: { r: RepoV; rank?: number }) {
  return (
    <Link href={`/r/${r.owner}/${r.name}`} className="row">
      <Avatar src={r.avatar} alt={`${r.owner} avatar`} />
      <span className="row-main">
        <span className="row-name">{r.name}</span>
        <span className="row-sub">{r.description}</span>
      </span>
      <span className="row-right">
        {rank !== undefined && <span className="hide-sm mono">#{rank}</span>}
        <span className="kbd">★ {fmtStars(r.stars)}</span>
      </span>
    </Link>
  );
}

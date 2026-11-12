import { getRepo } from "@/lib/data";
import { json } from "@/lib/http";
import { proposalStatus } from "@/lib/proposals";

export async function GET(_req: Request, { params }: { params: Promise<{ n: string }> }) {
  const token = process.env.GITHUB_TOKEN;
  const n = Number((await params).n);
  if (!token || !Number.isInteger(n) || n < 1) return json({ error: "Not found" }, 404, false);
  const s = await proposalStatus(token, n, (full) => { const [o, r] = full.split("/"); return Boolean(getRepo(o, r)); });
  return s ? json(s, 200, false) : json({ error: "Not found" }, 404, false);
}

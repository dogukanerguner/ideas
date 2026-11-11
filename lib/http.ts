export const CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";

export function md(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": CACHE, "Access-Control-Allow-Origin": "*", "X-Robots-Tag": "noindex, follow" } });
}

export function text(body: string): Response {
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": CACHE, "Access-Control-Allow-Origin": "*" } });
}

export function json(data: unknown, status = 200, cache = true): Response {
  return Response.json(data, { status, headers: { ...(cache ? { "Cache-Control": CACHE } : { "Cache-Control": "no-store" }), "Access-Control-Allow-Origin": "*" } });
}

export function wantsMd(req: Request): boolean {
  const u = new URL(req.url);
  const f = u.searchParams.get("format");
  if (f) return f === "md" || f === "markdown" || f === "text";
  const accept = req.headers.get("accept") ?? "";
  return /text\/(markdown|plain)/.test(accept) && !/application\/json/.test(accept);
}

import { NextResponse, type NextRequest } from "next/server";

/** Markdown twins: /r/a/b.md, /c/x.md, /t/y.md — and content negotiation for agents sending Accept: text/markdown. */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const m = pathname.match(/^\/(r\/[^/]+\/[^/]+|c\/[^/]+|t\/[^/]+)$/);
  if (!m) return NextResponse.next();
  const accept = req.headers.get("accept") ?? "";
  const isMd = pathname.endsWith(".md");
  if (isMd || (/text\/markdown/.test(accept) && !/text\/html/.test(accept))) {
    const url = req.nextUrl.clone();
    url.pathname = `/api/md/${m[1]}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/r/:path*", "/c/:path*", "/t/:path*"] };

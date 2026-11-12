import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Mark, Wordmark } from "@/components/brand/Logo";
import GlobalPalette from "@/components/GlobalPalette";
import { OpenPaletteButton } from "@/components/client";
import { JsonLd } from "@/components/ui";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: "%s · ideas" },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["vibe coding", "github repositories", "open source", "awesome list", "AI tools", "MCP", "llms.txt", "developer tools", "SaaS starter", "tech stack"],
  alternates: {
    canonical: "/",
    types: { "text/markdown": "/llms.txt" },
  },
  openGraph: { type: "website", siteName: SITE.name, title: SITE.title, description: SITE.tagline, url: SITE.url, locale: "en_US" },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.tagline },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  other: { "ai-catalog": `${SITE.url}/llms.txt` },
};

export const viewport: Viewport = { themeColor: "#12131a", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
        <link rel="help" href="/ai" />
      </head>
      <body>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": `${SITE.url}/#website`,
                url: SITE.url,
                name: SITE.name,
                description: SITE.description,
                inLanguage: "en",
                potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/stack?q={search_term_string}` }, "query-input": "required name=search_term_string" },
              },
              { "@type": "Organization", "@id": `${SITE.url}/#org`, name: "asveas", url: "https://asveas.com", sameAs: [`https://github.com/${SITE.repo}`] },
            ],
          }}
        />
        <header className="topbar">
          <Link href="/" className="brand" aria-label="ideas home">
            <Mark size={24} /> <Wordmark height={17} /> <small>/ repo launcher</small>
          </Link>
          <nav className="nav" aria-label="Main">
            <Link href="/c" className="hide-sm">Browse</Link>
            <Link href="/stack">Stack</Link>
            <Link href="/add" className="hide-sm">Add</Link>
            <Link href="/ai">For AI</Link>
            <OpenPaletteButton />
          </nav>
        </header>
        {children}
        <footer className="footer">
          <span>
            ideas · curated by humans, readable by machines · design: <a href={SITE.design.url}>{SITE.design.name}</a>
          </span>
          <nav aria-label="Machine-readable">
            <a href="/llms.txt">llms.txt</a>
            <a href="/llms-full.txt">llms-full.txt</a>
            <a href="/api/repos">JSON</a>
            <a href="/openapi.json">OpenAPI</a>
            <Link href="/ai">MCP</Link>
            <a href="/sitemap.xml">Sitemap</a>
            <Link href="/brand">Brand</Link>
            <a href={`https://github.com/${SITE.repo}`}>GitHub</a>
          </nav>
        </footer>
        <GlobalPalette />
      </body>
    </html>
  );
}

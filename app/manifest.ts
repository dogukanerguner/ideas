import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
export default function manifest(): MetadataRoute.Manifest {
  return { name: SITE.title, short_name: "ideas", description: SITE.tagline, start_url: "/", display: "standalone", background_color: "#12131a", theme_color: "#12131a", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}

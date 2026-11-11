import { paletteData } from "@/lib/palette";
export const dynamic = "force-static";
export function GET() {
  return Response.json(paletteData());
}

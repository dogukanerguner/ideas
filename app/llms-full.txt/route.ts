import { text } from "@/lib/http";
import { llmsFullTxt } from "@/lib/md";
export const dynamic = "force-static";
export function GET() {
  return text(llmsFullTxt());
}

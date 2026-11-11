import { text } from "@/lib/http";
import { llmsTxt } from "@/lib/md";
export const dynamic = "force-static";
export function GET() {
  return text(llmsTxt());
}

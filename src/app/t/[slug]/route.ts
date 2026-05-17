import type { NextRequest } from "next/server";
import { handleShortLinkRedirect } from "@/lib/redirect";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleShortLinkRedirect(request, "t", slug);
}

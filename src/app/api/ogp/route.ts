import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl } from "@/lib/validators";

function pickMeta(html: string, selectors: string[]) {
  for (const selector of selectors) {
    const regex = new RegExp(
      `<meta[^>]+(?:property|name)=["']${selector}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${selector}["'][^>]*>`,
      "i",
    );
    const match = html.match(regex);
    const value = match?.[1] ?? match?.[2];
    if (value) return value;
  }
  return null;
}

function pickTitle(html: string) {
  const ogTitle = pickMeta(html, ["og:title", "twitter:title"]);
  if (ogTitle) return ogTitle;
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
}

export async function POST(request: NextRequest) {
  await auth.protect();
  const body = (await request.json().catch(() => null)) as { url?: string } | null;

  if (!body?.url) {
    return NextResponse.json({ error: "URLが必要です。" }, { status: 400 });
  }

  let url: string;
  try {
    url = normalizeUrl(body.url);
  } catch {
    return NextResponse.json({ error: "http/httpsのURLを入力してください。" }, { status: 400 });
  }

  const response = await fetch(url, {
    headers: { "user-agent": "SLINK OGP Bot/1.0" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "OGP情報を取得できませんでした。" }, { status: 502 });
  }

  const html = await response.text();
  const image = pickMeta(html, ["og:image", "twitter:image"]);

  return NextResponse.json({
    title: pickTitle(html),
    description: pickMeta(html, ["og:description", "description", "twitter:description"]),
    image: image ? new URL(image, url).toString() : null,
  });
}

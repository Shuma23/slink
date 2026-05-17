import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleShortLinkRedirect } from "@/lib/redirect";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const redirectResponse = await handleShortLinkRedirect(request, "p", slug);
  if (redirectResponse.status !== 404) return redirectResponse;

  const supabase = createSupabaseServiceClient();
  const { data: page } = await supabase
    .from("landing_pages")
    .select("*, landing_page_items(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!page) return redirectResponse;

  const theme = (page.theme ?? {}) as { color?: string; font?: string; customCss?: string };
  const color = theme.color ?? "#2563eb";
  const items = ((page as typeof page & { landing_page_items?: Array<{
    id: string;
    title: string;
    url: string | null;
    type: string;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
  }> }).landing_page_items ?? [])
    .filter((item) => item.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(page.title)}</title>
<style>
body{margin:0;font-family:${escapeHtml(theme.font ?? "Inter")},system-ui,sans-serif;background:#f8fafc;color:#0f172a}
.wrap{max-width:560px;margin:0 auto;padding:48px 20px}
.profile{text-align:center;margin-bottom:28px}
.avatar{width:84px;height:84px;border-radius:50%;background:${color};margin:0 auto 16px;display:grid;place-items:center;color:white;font-size:32px;font-weight:700}
.bio{color:#475569;line-height:1.7}
.links{display:grid;gap:12px}
.card{display:flex;align-items:center;gap:12px;border:1px solid #e2e8f0;border-radius:8px;background:white;padding:14px 16px;color:#0f172a;text-decoration:none;box-shadow:0 1px 2px rgba(15,23,42,.04)}
.thumb{width:44px;height:44px;border-radius:6px;object-fit:cover;background:#e2e8f0}
.type{font-size:12px;color:${color};font-weight:600;text-transform:uppercase}
${theme.customCss ?? ""}
</style>
</head>
<body><main class="wrap"><section class="profile"><div class="avatar">${escapeHtml(page.title.slice(0, 1))}</div><h1>${escapeHtml(page.title)}</h1><p class="bio">${escapeHtml(page.bio ?? "")}</p></section><section class="links">${items
    .map((item) => `<a class="card" href="${escapeAttribute(item.url ?? "#")}" target="_blank" rel="noreferrer">${item.image_url ? `<img class="thumb" src="${escapeAttribute(item.image_url)}" alt="" />` : ""}<span><span class="type">${escapeHtml(item.type)}</span><br/>${escapeHtml(item.title)}</span></a>`)
    .join("")}</section></main></body></html>`;

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

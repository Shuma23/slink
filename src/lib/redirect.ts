import { createHash } from "node:crypto";
import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import type { LinkDestination } from "@/lib/database.types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const botPattern =
  /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|discordbot|whatsapp|preview|embedly|quora link preview|vkshare|telegrambot/i;

function isLikelyBot(userAgent: string | null) {
  return !userAgent || botPattern.test(userAgent);
}

function getIpHash(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const salt = process.env.IP_HASH_SALT ?? process.env.CLERK_SECRET_KEY ?? "local-development";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function pickDestination(originalUrl: string, destinations: LinkDestination[]) {
  if (destinations.length === 0) return { url: originalUrl, destinationId: null };
  const active = destinations.filter((destination) => destination.is_active && destination.weight > 0);
  if (active.length === 0) return null;

  const total = active.reduce((sum, item) => sum + Math.max(item.weight, 1), 0);
  let cursor = Math.floor(Math.random() * total);

  for (const destination of active) {
    cursor -= Math.max(destination.weight, 1);
    if (cursor < 0) return { url: destination.destination_url, destinationId: destination.id };
  }

  const fallback = active[0];
  return { url: fallback.destination_url, destinationId: fallback.id };
}

type ClickEventPayload = {
  linkId: string;
  destinationId: string | null;
  referrer: string | null;
  userAgent: string | null;
  ipHash: string;
  country: string | null;
};

async function recordClickEvent(payload: ClickEventPayload) {
  const parser = new UAParser(payload.userAgent ?? undefined);
  const result = parser.getResult();
  const deviceType = result.device.type ?? (result.os.name ? "desktop" : "unknown");
  const supabase = createSupabaseServiceClient();

  const insertClick = supabase.from("click_events").insert({
    link_id: payload.linkId,
    destination_id: payload.destinationId,
    referrer: payload.referrer,
    user_agent: payload.userAgent,
    ip_hash: payload.ipHash,
    country: payload.country,
    device_type: deviceType,
    browser: result.browser.name ?? null,
    os: result.os.name ?? null,
  });

  const incrementDestination = payload.destinationId
    ? supabase.rpc("increment_destination_clicks", { destination_uuid: payload.destinationId })
    : Promise.resolve({ error: null });

  const [clickResult, incrementResult] = await Promise.all([insertClick, incrementDestination]);

  if (clickResult.error) {
    console.error("Failed to record click event", clickResult.error);
  }

  if (incrementResult.error) {
    console.error("Failed to increment destination clicks", incrementResult.error);
  }
}

export async function handleShortLinkRedirect(
  request: NextRequest,
  pathType: "s" | "t" | "p",
  slug: string,
) {
  const supabase = createSupabaseServiceClient();
  const { data: link, error } = await supabase
    .from("links")
    .select(
      "id, original_url, is_active, is_archived, link_destinations(id, destination_url, weight, is_active, clicks_count, link_id, created_at)",
    )
    .eq("path_type", pathType)
    .eq("slug", slug)
    .single();

  if (error || !link || !link.is_active || link.is_archived) {
    return new NextResponse("Link not found", { status: 404 });
  }

  const destinations = ((link as typeof link & { link_destinations?: LinkDestination[] })
    .link_destinations ?? []) as LinkDestination[];
  const selected = pickDestination(link.original_url, destinations);
  if (!selected) {
    return new NextResponse("No active destination", { status: 404 });
  }
  const userAgent = request.headers.get("user-agent");

  if (!isLikelyBot(userAgent)) {
    const payload: ClickEventPayload = {
      linkId: link.id,
      destinationId: selected.destinationId,
      referrer: request.headers.get("referer"),
      userAgent,
      ipHash: getIpHash(request),
      country: request.headers.get("x-vercel-ip-country"),
    };

    after(async () => {
      await recordClickEvent(payload);
    });
  }

  return NextResponse.redirect(selected.url, { status: 302 });
}

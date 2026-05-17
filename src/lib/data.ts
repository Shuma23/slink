import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import type { ClickEvent, Label, LandingPage, Link, LinkDestination } from "@/lib/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LinkWithLabels = Link & {
  labels: Label[];
  clicks_count: number;
};

export type DashboardStats = {
  linksCount: number;
  clicksCount: number;
  activeLinksCount: number;
  popularLinks: LinkWithLabels[];
  recentClicks: Array<ClickEvent & { link?: Pick<Link, "id" | "slug" | "path_type" | "title"> }>;
  dailyClicks: Array<{ date: string; clicks: number }>;
  deviceRows: Array<{ name: string; value: number }>;
};

async function requireUserClient() {
  const { userId } = await auth.protect();
  const supabase = await createSupabaseServerClient();
  return { userId, supabase };
}

export async function getLabels() {
  if (!isSupabaseConfigured()) return [];
  const { supabase } = await requireUserClient();
  const { data, error } = await supabase.from("labels").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLinks(options?: {
  includeArchived?: boolean;
  q?: string;
  labelId?: string;
}) {
  if (!isSupabaseConfigured()) return [];
  const { supabase } = await requireUserClient();
  let query = supabase.from("links").select("*").order("created_at", { ascending: false });

  if (!options?.includeArchived) query = query.eq("is_archived", false);
  if (options?.q) {
    const q = `%${options.q}%`;
    query = query.or(`slug.ilike.${q},title.ilike.${q},original_url.ilike.${q}`);
  }

  const { data: links, error } = await query;
  if (error) throw new Error(error.message);
  if (!links?.length) return [];

  const ids = links.map((link) => link.id);
  const [{ data: labelRows }, { data: clickRows }] = await Promise.all([
    supabase.from("link_labels").select("link_id, label_id").in("link_id", ids),
    supabase.from("click_events").select("link_id").in("link_id", ids),
  ]);

  const labelIds = [...new Set((labelRows ?? []).map((row) => row.label_id))];
  const { data: labelData } = labelIds.length
    ? await supabase.from("labels").select("*").in("id", labelIds)
    : { data: [] as Label[] };
  const labelsById = new Map((labelData ?? []).map((label) => [label.id, label as Label]));

  const labelsByLink = new Map<string, Label[]>();
  for (const row of labelRows ?? []) {
    const labels = labelsByLink.get(row.link_id) ?? [];
    const label = labelsById.get(row.label_id);
    if (label) labels.push(label);
    labelsByLink.set(row.link_id, labels);
  }

  const clicksByLink = new Map<string, number>();
  for (const row of clickRows ?? []) {
    clicksByLink.set(row.link_id, (clicksByLink.get(row.link_id) ?? 0) + 1);
  }

  const mapped = links.map((link) => ({
    ...link,
    labels: labelsByLink.get(link.id) ?? [],
    clicks_count: clicksByLink.get(link.id) ?? 0,
  }));

  if (options?.labelId) {
    return mapped.filter((link) => link.labels.some((label) => label.id === options.labelId));
  }

  return mapped;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isSupabaseConfigured()) {
    return {
      linksCount: 0,
      activeLinksCount: 0,
      clicksCount: 0,
      popularLinks: [],
      recentClicks: [],
      dailyClicks: [],
      deviceRows: [],
    };
  }
  const links = await getLinks({ includeArchived: false });
  const { supabase } = await requireUserClient();
  const linkIds = links.map((link) => link.id);

  if (linkIds.length === 0) {
    return {
      linksCount: 0,
      activeLinksCount: 0,
      clicksCount: 0,
      popularLinks: [],
      recentClicks: [],
      dailyClicks: [],
      deviceRows: [],
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - 14);

  const { data: clicks, error } = await supabase
    .from("click_events")
    .select("*")
    .in("link_id", linkIds)
    .gte("clicked_at", since.toISOString())
    .order("clicked_at", { ascending: false });

  if (error) throw new Error(error.message);

  const byDay = new Map<string, number>();
  const byDevice = new Map<string, number>();
  for (const click of clicks ?? []) {
    const key = click.clicked_at.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
    const device = click.device_type || "unknown";
    byDevice.set(device, (byDevice.get(device) ?? 0) + 1);
  }

  const linkById = new Map(links.map((link) => [link.id, link]));

  return {
    linksCount: links.length,
    activeLinksCount: links.filter((link) => link.is_active).length,
    clicksCount: clicks?.length ?? 0,
    popularLinks: [...links].sort((a, b) => b.clicks_count - a.clicks_count).slice(0, 5),
    recentClicks: (clicks ?? []).slice(0, 8).map((click) => {
      const link = linkById.get(click.link_id);
      return {
        ...click,
        link: link
          ? { id: link.id, slug: link.slug, path_type: link.path_type, title: link.title }
          : undefined,
      };
    }),
    dailyClicks: Array.from(byDay.entries()).map(([date, count]) => ({ date, clicks: count })),
    deviceRows: Array.from(byDevice.entries()).map(([name, value]) => ({ name, value })),
  };
}

export async function getLinkDetail(id: string) {
  if (!isSupabaseConfigured()) notFound();
  const { supabase } = await requireUserClient();
  const { data: link, error } = await supabase.from("links").select("*").eq("id", id).single();
  if (error || !link) notFound();

  const [{ data: destinations }, { data: clicks }, { data: labelRows }, { data: allLabels }] =
    await Promise.all([
      supabase
        .from("link_destinations")
        .select("*")
        .eq("link_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("click_events")
        .select("*")
        .eq("link_id", id)
        .order("clicked_at", { ascending: false })
        .limit(300),
      supabase.from("link_labels").select("label_id").eq("link_id", id),
      supabase.from("labels").select("*").order("created_at", { ascending: false }),
    ]);

  const attachedIds = new Set((labelRows ?? []).map((row) => row.label_id));
  const labels = ((allLabels ?? []) as Label[]).filter((label) => attachedIds.has(label.id));

  return {
    link,
    destinations: (destinations ?? []) as LinkDestination[],
    clicks: (clicks ?? []) as ClickEvent[],
    labels,
    allLabels: (allLabels ?? []) as Label[],
  };
}

export async function getLandingPages() {
  if (!isSupabaseConfigured()) return [];
  const { supabase } = await requireUserClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as LandingPage[];
}

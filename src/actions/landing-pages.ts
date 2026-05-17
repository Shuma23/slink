"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { landingPageSchema, normalizeUrl } from "@/lib/validators";

type ActionState = {
  ok: boolean;
  message: string;
};

type DraftItem = {
  type: string;
  title: string;
  url?: string;
  image_url?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createLandingPageAction(
  _: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await auth.protect();
  const parsed = landingPageSchema.safeParse({
    slug: readString(formData, "slug"),
    title: readString(formData, "title"),
    bio: readString(formData, "bio"),
    theme_color: readString(formData, "theme_color") || "#2563eb",
    font: readString(formData, "font") || "Inter",
    custom_css: readString(formData, "custom_css"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  let items: DraftItem[] = [];
  try {
    items = JSON.parse(readString(formData, "items_json") || "[]") as DraftItem[];
  } catch {
    return { ok: false, message: "リンクカードの形式が不正です。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .insert({
      user_id: userId,
      slug: parsed.data.slug,
      title: parsed.data.title,
      bio: parsed.data.bio || null,
      theme: {
        color: parsed.data.theme_color,
        font: parsed.data.font,
        customCss: parsed.data.custom_css || "",
        proBackgroundMedia: false,
      },
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? "このページslugは既に使われています。" : error.message,
    };
  }

  const normalizedItems = items
    .filter((item) => item.title?.trim())
    .slice(0, 30)
    .map((item, index) => ({
      landing_page_id: data.id,
      type: ["link", "sns", "product", "image"].includes(item.type) ? item.type : "link",
      title: item.title.trim(),
      url: item.url ? normalizeUrl(item.url) : null,
      image_url: item.image_url || null,
      sort_order: index,
    }));

  if (normalizedItems.length > 0) {
    const { error: itemError } = await supabase.from("landing_page_items").insert(normalizedItems);
    if (itemError) return { ok: false, message: itemError.message };
  }

  revalidatePath("/dashboard/pages");
  redirect("/dashboard/pages");
}

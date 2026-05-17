"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createLinkSchema,
  destinationSchema,
  generateSlug,
  normalizeUrl,
  slugSchema,
  updateLinkSchema,
} from "@/lib/validators";
import { z } from "zod";

type ActionState = {
  ok: boolean;
  message: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const linkMetaSchema = z.object({
  id: z.string().uuid(),
  slug: slugSchema,
  path_type: z.enum(["s", "t", "p"]),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  memo: z.string().trim().max(2000).optional().or(z.literal("")),
  og_image_url: z.string().trim().url().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

const singleDestinationSchema = z.object({
  id: z.string().uuid(),
  original_url: z
    .string()
    .trim()
    .url("有効なURLを入力してください。")
    .refine((value) => {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    }, "http:// または https:// のURLのみ利用できます。"),
});

export async function createLinkAction(_: ActionState | null, formData: FormData): Promise<ActionState> {
  const { userId } = await auth.protect();
  const parsed = createLinkSchema.safeParse({
    original_url: readString(formData, "original_url"),
    slug: readString(formData, "slug"),
    path_type: readString(formData, "path_type") || "s",
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    memo: readString(formData, "memo"),
    og_image_url: readString(formData, "og_image_url"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const slug = parsed.data.slug || generateSlug();
  const { data, error } = await supabase
    .from("links")
    .insert({
      user_id: userId,
      original_url: normalizeUrl(parsed.data.original_url),
      slug,
      path_type: parsed.data.path_type,
      title: parsed.data.title || null,
      description: parsed.data.description || null,
      memo: parsed.data.memo || null,
      og_image_url: parsed.data.og_image_url || null,
    })
    .select("id")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return {
      ok: false,
      message: isDuplicate ? "このパスとslugの組み合わせは既に使われています。" : error.message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/links");
  redirect(`/dashboard/links/${data.id}`);
}

export async function updateLinkAction(_: ActionState | null, formData: FormData): Promise<ActionState> {
  await auth.protect();
  const parsed = updateLinkSchema.safeParse({
    id: readString(formData, "id"),
    original_url: readString(formData, "original_url"),
    slug: readString(formData, "slug"),
    path_type: readString(formData, "path_type") || "s",
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    memo: readString(formData, "memo"),
    og_image_url: readString(formData, "og_image_url"),
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("links")
    .update({
      original_url: normalizeUrl(parsed.data.original_url),
      slug: parsed.data.slug || generateSlug(),
      path_type: parsed.data.path_type,
      title: parsed.data.title || null,
      description: parsed.data.description || null,
      memo: parsed.data.memo || null,
      og_image_url: parsed.data.og_image_url || null,
      is_active: parsed.data.is_active ?? true,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? "このパスとslugの組み合わせは既に使われています。" : error.message,
    };
  }

  revalidatePath("/dashboard/links");
  revalidatePath(`/dashboard/links/${parsed.data.id}`);
  return { ok: true, message: "リンクを保存しました。" };
}

export async function updateLinkMetaAction(_: ActionState | null, formData: FormData): Promise<ActionState> {
  await auth.protect();
  const parsed = linkMetaSchema.safeParse({
    id: readString(formData, "id"),
    slug: readString(formData, "slug"),
    path_type: readString(formData, "path_type") || "s",
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    memo: readString(formData, "memo"),
    og_image_url: readString(formData, "og_image_url"),
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("links")
    .update({
      slug: parsed.data.slug,
      path_type: parsed.data.path_type,
      title: parsed.data.title || null,
      description: parsed.data.description || null,
      memo: parsed.data.memo || null,
      og_image_url: parsed.data.og_image_url || null,
      is_active: parsed.data.is_active ?? true,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? "このパスとslugの組み合わせは既に使われています。" : error.message,
    };
  }

  revalidatePath("/dashboard/links");
  revalidatePath(`/dashboard/links/${parsed.data.id}`);
  return { ok: true, message: "リンク設定を保存しました。" };
}

export async function updateSingleDestinationAction(
  _: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  await auth.protect();
  const parsed = singleDestinationSchema.safeParse({
    id: readString(formData, "id"),
    original_url: readString(formData, "original_url"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase
    .from("link_destinations")
    .select("id", { count: "exact", head: true })
    .eq("link_id", parsed.data.id);

  if (countError) return { ok: false, message: countError.message };
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message: "A/Bテストモード中は通常URLを編集できません。通常モードに戻すにはA/B遷移先をすべて削除してください。",
    };
  }

  const { error } = await supabase
    .from("links")
    .update({ original_url: normalizeUrl(parsed.data.original_url) })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/dashboard/links/${parsed.data.id}`);
  return { ok: true, message: "通常モードの遷移先URLを保存しました。" };
}

export async function toggleLinkActiveAction(formData: FormData) {
  await auth.protect();
  const id = readString(formData, "id");
  const isActive = formData.get("is_active") === "true";

  const supabase = await createSupabaseServerClient();
  await supabase.from("links").update({ is_active: isActive }).eq("id", id);

  revalidatePath("/dashboard/links");
  revalidatePath(`/dashboard/links/${id}`);
}

export async function archiveLinkAction(formData: FormData) {
  await auth.protect();
  const id = readString(formData, "id");
  const shouldArchive = formData.get("archive") === "true";

  const supabase = await createSupabaseServerClient();
  await supabase.from("links").update({ is_archived: shouldArchive }).eq("id", id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/links");
  revalidatePath(`/dashboard/links/${id}`);
}

export async function addDestinationAction(_: ActionState | null, formData: FormData): Promise<ActionState> {
  await auth.protect();
  const parsed = destinationSchema.safeParse({
    link_id: readString(formData, "link_id"),
    destination_url: readString(formData, "destination_url"),
    weight: readString(formData, "weight") || "1",
    is_active: formData.get("is_active") !== "false",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("link_destinations")
    .select("id", { count: "exact", head: true })
    .eq("link_id", parsed.data.link_id);

  if ((count ?? 0) >= 10) {
    return { ok: false, message: "A/Bテストの遷移先は最大10件までです。" };
  }

  const { error } = await supabase.from("link_destinations").insert({
    link_id: parsed.data.link_id,
    destination_url: normalizeUrl(parsed.data.destination_url),
    weight: parsed.data.weight,
    is_active: parsed.data.is_active,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/dashboard/links/${parsed.data.link_id}`);
  return { ok: true, message: "A/Bテストの遷移先を追加しました。" };
}

export async function updateDestinationAction(formData: FormData) {
  await auth.protect();
  const id = readString(formData, "id");
  const linkId = readString(formData, "link_id");
  const weight = Number(readString(formData, "weight") || 50);
  const isActive = formData.get("is_active") === "on";

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("link_destinations")
    .update({ weight: Math.min(Math.max(weight, 0), 100), is_active: isActive })
    .eq("id", id)
    .eq("link_id", linkId);

  revalidatePath(`/dashboard/links/${linkId}`);
}

export async function deleteDestinationAction(formData: FormData) {
  await auth.protect();
  const id = readString(formData, "id");
  const linkId = readString(formData, "link_id");

  const supabase = await createSupabaseServerClient();
  await supabase.from("link_destinations").delete().eq("id", id).eq("link_id", linkId);

  revalidatePath(`/dashboard/links/${linkId}`);
}

export async function attachLabelAction(formData: FormData) {
  await auth.protect();
  const linkId = readString(formData, "link_id");
  const labelId = readString(formData, "label_id");

  const supabase = await createSupabaseServerClient();
  await supabase.from("link_labels").upsert({ link_id: linkId, label_id: labelId });

  revalidatePath(`/dashboard/links/${linkId}`);
  revalidatePath("/dashboard/links");
}

export async function detachLabelAction(formData: FormData) {
  await auth.protect();
  const linkId = readString(formData, "link_id");
  const labelId = readString(formData, "label_id");

  const supabase = await createSupabaseServerClient();
  await supabase.from("link_labels").delete().eq("link_id", linkId).eq("label_id", labelId);

  revalidatePath(`/dashboard/links/${linkId}`);
  revalidatePath("/dashboard/links");
}

export async function updateOgpAction(_: ActionState | null, formData: FormData): Promise<ActionState> {
  await auth.protect();
  const id = readString(formData, "id");
  const slug = slugSchema.safeParse("abc");
  if (!id || !slug.success) return { ok: false, message: "不正なリクエストです。" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("links")
    .update({
      title: readString(formData, "title") || null,
      description: readString(formData, "description") || null,
      og_image_url: readString(formData, "og_image_url") || null,
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/dashboard/links/${id}`);
  return { ok: true, message: "OGP情報を保存しました。" };
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { labelSchema } from "@/lib/validators";

type ActionState = {
  ok: boolean;
  message: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createLabelAction(_: ActionState | null, formData: FormData): Promise<ActionState> {
  const { userId } = await auth.protect();
  const parsed = labelSchema.safeParse({
    name: readString(formData, "name"),
    color: readString(formData, "color") || "#2563eb",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("labels").insert({
    user_id: userId,
    name: parsed.data.name,
    color: parsed.data.color,
  });

  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? "同じ名前のラベルが既にあります。" : error.message,
    };
  }

  revalidatePath("/dashboard/labels");
  revalidatePath("/dashboard/links");
  return { ok: true, message: "ラベルを作成しました。" };
}

export async function deleteLabelAction(formData: FormData) {
  await auth.protect();
  const id = readString(formData, "id");
  const supabase = await createSupabaseServerClient();
  await supabase.from("labels").delete().eq("id", id);
  revalidatePath("/dashboard/labels");
  revalidatePath("/dashboard/links");
}

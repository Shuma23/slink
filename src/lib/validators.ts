import { z } from "zod";

const urlSchema = z
  .string()
  .trim()
  .url("有効なURLを入力してください。")
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "http:// または https:// のURLのみ利用できます。");

export const slugSchema = z
  .string()
  .trim()
  .min(3, "slugは3文字以上で入力してください。")
  .max(80, "slugは80文字以内で入力してください。")
  .regex(/^[A-Za-z0-9_-]+$/, "slugは英数字・ハイフン・アンダースコアのみ利用できます。");

export const pathTypeSchema = z.enum(["s", "t", "p"]);

export const createLinkSchema = z.object({
  original_url: urlSchema,
  slug: slugSchema.optional().or(z.literal("")),
  path_type: pathTypeSchema.default("s"),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  og_image_url: z.string().trim().url().optional().or(z.literal("")),
});

export const updateLinkSchema = createLinkSchema.extend({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
});

export const destinationSchema = z.object({
  link_id: z.string().uuid(),
  destination_url: urlSchema,
  weight: z.coerce.number().int().min(0).max(100).default(50),
  is_active: z.boolean().default(true),
});

export const labelSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const landingPageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  theme_color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#2563eb"),
  font: z.string().trim().max(60).default("Inter"),
  custom_css: z.string().trim().max(4000).optional().or(z.literal("")),
});

export function normalizeUrl(value: string) {
  const parsed = new URL(value);
  return parsed.toString();
}

export function generateSlug(length = 7) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

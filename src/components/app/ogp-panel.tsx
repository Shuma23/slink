"use client";

import { useActionState, useState } from "react";
import { updateOgpAction } from "@/actions/links";
import type { Link } from "@/lib/database.types";
import { ActionMessage } from "@/components/app/action-message";
import { SubmitButton } from "@/components/app/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = { ok: false, message: "" };

export function OgpPanel({ link }: { link: Link }) {
  const [state, action] = useActionState(updateOgpAction, initialState);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(link.title ?? "");
  const [description, setDescription] = useState(link.description ?? "");
  const [image, setImage] = useState(link.og_image_url ?? "");

  async function fetchOgp() {
    setLoading(true);
    try {
      const response = await fetch("/api/ogp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: link.original_url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "取得に失敗しました。");
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setImage(data.image ?? "");
    } catch (error) {
      alert(error instanceof Error ? error.message : "取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={link.id} />
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={fetchOgp} disabled={loading}>
            {loading ? "取得中..." : "URLから取得"}
          </Button>
        </div>
        <div className="grid gap-2">
          <Label>タイトル</Label>
          <Input name="title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>説明</Label>
          <Textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>画像URL / カスタム画像</Label>
          <Input name="og_image_url" value={image} onChange={(event) => setImage(event.target.value)} />
        </div>
        <ActionMessage state={state} />
        <SubmitButton>OGPを保存</SubmitButton>
      </form>
      <div className="space-y-3">
        {["Twitter", "Facebook", "LINE"].map((service) => (
          <div key={service} className="overflow-hidden rounded-md border border-slate-200">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-36 w-full object-cover" />
            ) : (
              <div className="grid h-36 place-items-center bg-slate-100 text-sm text-slate-500">No image</div>
            )}
            <div className="p-3">
              <p className="text-xs font-medium text-slate-500">{service} preview</p>
              <p className="mt-1 line-clamp-1 font-semibold">{title || "Untitled"}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{description || "No description"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import {
  createLinkAction,
  updateLinkAction,
  updateLinkMetaAction,
  updateSingleDestinationAction,
} from "@/actions/links";
import type { Link } from "@/lib/database.types";
import { ActionMessage } from "@/components/app/action-message";
import { SubmitButton } from "@/components/app/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState = { ok: false, message: "" };

export function LinkCreateForm() {
  const [state, action] = useActionState(createLinkAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>短縮URLを作成</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5">
          <LinkFields />
          <ActionMessage state={state} />
          <div className="flex justify-end">
            <SubmitButton>作成する</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function LinkEditForm({ link }: { link: Link }) {
  const [state, action] = useActionState(updateLinkAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="id" value={link.id} />
      <LinkFields link={link} />
      <label className="flex items-center gap-2 text-sm">
        <input name="is_active" type="checkbox" defaultChecked={link.is_active} className="h-4 w-4" />
        有効にする
      </label>
      <ActionMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton>変更を保存</SubmitButton>
      </div>
    </form>
  );
}

export function LinkMetaForm({ link }: { link: Link }) {
  const [state, action] = useActionState(updateLinkMetaAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="id" value={link.id} />
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="grid gap-2">
          <Label>パス</Label>
          <Select name="path_type" defaultValue={link.path_type}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="s">/s/</SelectItem>
              <SelectItem value="t">/t/</SelectItem>
              <SelectItem value="p">/p/</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="meta_slug">カスタムID</Label>
          <Input id="meta_slug" name="slug" placeholder="spring-campaign" defaultValue={link.slug} required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="meta_title">タイトル</Label>
        <Input id="meta_title" name="title" defaultValue={link.title ?? ""} placeholder="春のキャンペーン" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="meta_description">説明</Label>
        <Textarea id="meta_description" name="description" defaultValue={link.description ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="meta_og_image_url">OGP画像URL</Label>
        <Input id="meta_og_image_url" name="og_image_url" type="url" defaultValue={link.og_image_url ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="is_active" type="checkbox" defaultChecked={link.is_active} className="h-4 w-4" />
        有効にする
      </label>
      <ActionMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton>基本設定を保存</SubmitButton>
      </div>
    </form>
  );
}

export function SingleDestinationForm({
  link,
  disabled,
}: {
  link: Link;
  disabled: boolean;
}) {
  const [state, action] = useActionState(updateSingleDestinationAction, initialState);

  return (
    <form action={action} className="grid gap-4 rounded-md border border-slate-200 p-4">
      <input type="hidden" name="id" value={link.id} />
      <div className="grid gap-2">
        <Label htmlFor="single_original_url">通常モードの遷移先URL</Label>
        <Input
          id="single_original_url"
          name="original_url"
          type="url"
          placeholder="https://example.com/very/long/url"
          defaultValue={link.original_url}
          disabled={disabled}
          required
        />
        {disabled ? (
          <p className="text-sm text-amber-700">
            A/Bテストモードが有効です。通常URLを編集するにはA/B遷移先をすべて削除してください。
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            A/B遷移先がない時だけ、このURLへ固定でリダイレクトします。
          </p>
        )}
      </div>
      <ActionMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton disabled={disabled}>通常URLを保存</SubmitButton>
      </div>
    </form>
  );
}

function LinkFields({ link }: { link?: Link }) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="original_url">遷移先URL</Label>
        <Input
          id="original_url"
          name="original_url"
          type="url"
          placeholder="https://example.com/very/long/url"
          defaultValue={link?.original_url}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="grid gap-2">
          <Label>パス</Label>
          <Select name="path_type" defaultValue={link?.path_type ?? "s"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="s">/s/</SelectItem>
              <SelectItem value="t">/t/</SelectItem>
              <SelectItem value="p">/p/</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slug">カスタムID</Label>
          <Input id="slug" name="slug" placeholder="spring-campaign" defaultValue={link?.slug} />
          <p className="text-xs text-slate-500">未入力なら自動生成。英数字、ハイフン、アンダースコアが使えます。</p>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" name="title" defaultValue={link?.title ?? ""} placeholder="春のキャンペーン" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">説明</Label>
        <Textarea id="description" name="description" defaultValue={link?.description ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="og_image_url">OGP画像URL</Label>
        <Input id="og_image_url" name="og_image_url" type="url" defaultValue={link?.og_image_url ?? ""} />
      </div>
    </>
  );
}

export function ExportComingSoonButton() {
  return (
    <Button type="button" variant="outline" onClick={() => alert("エクスポート機能は準備中です。")}>
      エクスポート
    </Button>
  );
}

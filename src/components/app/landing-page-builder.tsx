"use client";

import { useActionState, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { createLandingPageAction } from "@/actions/landing-pages";
import { ActionMessage } from "@/components/app/action-message";
import { SubmitButton } from "@/components/app/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = { ok: false, message: "" };

type Item = {
  id: string;
  type: string;
  title: string;
  url: string;
  image_url: string;
};

export function LandingPageBuilder() {
  const [state, action] = useActionState(createLandingPageAction, initialState);
  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), type: "link", title: "公式サイト", url: "https://example.com", image_url: "" },
  ]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const itemsJson = useMemo(() => JSON.stringify(items), [items]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.id === active.id);
      const newIndex = current.findIndex((item) => item.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="items_json" value={itemsJson} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          <Label>ページslug</Label>
          <Input name="slug" placeholder="my-profile" required />
        </div>
        <div className="grid gap-2">
          <Label>タイトル</Label>
          <Input name="title" placeholder="山田 太郎" required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Bio</Label>
        <Textarea name="bio" placeholder="活動紹介やプロフィール文" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-2">
          <Label>テーマカラー</Label>
          <Input name="theme_color" type="color" defaultValue="#2563eb" />
        </div>
        <div className="grid gap-2">
          <Label>フォント</Label>
          <Input name="font" defaultValue="Inter" />
        </div>
        <div className="rounded-md border border-dashed border-slate-200 p-3 text-sm text-slate-500">
          背景画像・動画はProプラン想定として準備中です。
        </div>
      </div>
      <div className="grid gap-2">
        <Label>カスタムCSS</Label>
        <Textarea name="custom_css" placeholder=".card { border-radius: 8px; }" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>リンクカード</Label>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setItems((current) => [
                ...current,
                { id: crypto.randomUUID(), type: "link", title: "", url: "", image_url: "" },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-3">
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onChange={updateItem}
                  onRemove={(id) => setItems((current) => current.filter((row) => row.id !== id))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <ActionMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton>ページを作成</SubmitButton>
      </div>
    </form>
  );
}

function SortableItem({
  item,
  onChange,
  onRemove,
}: {
  item: Item;
  onChange: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[auto_140px_1fr_1fr_auto] md:items-end">
      <button type="button" className="h-10 text-slate-400" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="grid gap-1">
        <Label>タイプ</Label>
        <select
          value={item.type}
          onChange={(event) => onChange(item.id, { type: event.target.value })}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="link">通常</option>
          <option value="sns">SNS</option>
          <option value="product">商品</option>
          <option value="image">画像付き</option>
        </select>
      </div>
      <div className="grid gap-1">
        <Label>タイトル</Label>
        <Input value={item.title} onChange={(event) => onChange(item.id, { title: event.target.value })} />
      </div>
      <div className="grid gap-1">
        <Label>URL</Label>
        <Input value={item.url} onChange={(event) => onChange(item.id, { url: event.target.value })} />
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(item.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

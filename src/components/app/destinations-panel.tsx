"use client";

import { useActionState, useState } from "react";
import { addDestinationAction, deleteDestinationAction, updateDestinationAction } from "@/actions/links";
import type { LinkDestination } from "@/lib/database.types";
import { ActionMessage } from "@/components/app/action-message";
import { SubmitButton } from "@/components/app/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { ok: false, message: "" };

export function DestinationCreateForm({ linkId, count }: { linkId: string; count: number }) {
  const [state, action] = useActionState(addDestinationAction, initialState);
  const [weight, setWeight] = useState(50);

  return (
    <form action={action} className="grid gap-3 rounded-md border border-slate-200 p-4">
      <input type="hidden" name="link_id" value={linkId} />
      <div>
        <p className="font-medium">A/Bテスト遷移先</p>
        <p className="mt-1 text-sm text-slate-500">
          1件でも追加するとA/Bテストモードになります。通常URLは使われず、ここにある有効な遷移先から重み付けで選ばれます。
        </p>
      </div>
      <div className="grid gap-2">
        <Label>遷移先URL</Label>
        <Input name="destination_url" type="url" placeholder="https://example.com/variant-a" disabled={count >= 10} />
      </div>
      <WeightSlider id="new_destination_weight" value={weight} onChange={setWeight} disabled={count >= 10} />
      <ActionMessage state={state} />
      <SubmitButton disabled={count >= 10}>A/B遷移先を追加</SubmitButton>
    </form>
  );
}

export function DestinationRows({ destinations }: { destinations: LinkDestination[] }) {
  if (!destinations.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        A/Bテストの遷移先はまだありません。現在は通常モードで、通常URLへ固定リダイレクトします。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {destinations.map((destination) => (
        <DestinationRow key={destination.id} destination={destination} />
      ))}
    </div>
  );
}

function DestinationRow({ destination }: { destination: LinkDestination }) {
  const [weight, setWeight] = useState(Math.min(Math.max(destination.weight, 0), 100));

  return (
    <div className="rounded-md border border-slate-200 p-4">
      <p className="break-all font-medium">{destination.destination_url}</p>
      <form action={updateDestinationAction} className="mt-3 grid gap-3">
        <input type="hidden" name="id" value={destination.id} />
        <input type="hidden" name="link_id" value={destination.link_id} />
        <WeightSlider id={`weight_${destination.id}`} value={weight} onChange={setWeight} />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input name="is_active" type="checkbox" defaultChecked={destination.is_active} className="h-4 w-4" />
            有効
          </label>
          <Button type="submit" variant="outline" size="sm">
            保存
          </Button>
          <span className="text-sm text-slate-500">clicks: {destination.clicks_count}</span>
        </div>
      </form>
      <form action={deleteDestinationAction} className="mt-2">
        <input type="hidden" name="id" value={destination.id} />
        <input type="hidden" name="link_id" value={destination.link_id} />
        <Button type="submit" variant="ghost" size="sm">
          削除
        </Button>
      </form>
    </div>
  );
}

function WeightSlider({
  id,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>重み</Label>
        <span className="text-sm font-medium text-slate-600">{safeValue}</span>
      </div>
      <input type="hidden" name="weight" value={safeValue} />
      <div
        className="relative h-7"
        onPointerDown={(event) => {
          if (disabled) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event.currentTarget, event.clientX, onChange);
        }}
        onPointerMove={(event) => {
          if (disabled || event.buttons !== 1) return;
          updateFromPointer(event.currentTarget, event.clientX, onChange);
        }}
      >
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200" />
        <div
          className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-teal-600"
          style={{ width: `${safeValue}%` }}
        />
        <button
          id={id}
          type="button"
          disabled={disabled}
          role="slider"
          aria-label="重み"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeValue}
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-600 shadow-sm ring-2 ring-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:opacity-50"
          style={{ left: `${safeValue}%` }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              onChange(Math.max(0, safeValue - 1));
            }
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              onChange(Math.min(100, safeValue + 1));
            }
            if (event.key === "Home") {
              event.preventDefault();
              onChange(0);
            }
            if (event.key === "End") {
              event.preventDefault();
              onChange(100);
            }
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}

function updateFromPointer(
  element: HTMLDivElement,
  clientX: number,
  onChange: (value: number) => void,
) {
  const rect = element.getBoundingClientRect();
  const ratio = (clientX - rect.left) / rect.width;
  onChange(Math.min(100, Math.max(0, Math.round(ratio * 100))));
}

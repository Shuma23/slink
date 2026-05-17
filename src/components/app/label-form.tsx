"use client";

import { useActionState } from "react";
import { createLabelAction } from "@/actions/labels";
import { ActionMessage } from "@/components/app/action-message";
import { SubmitButton } from "@/components/app/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { ok: false, message: "" };

export function LabelForm() {
  const [state, action] = useActionState(createLabelAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-[1fr_140px_auto] md:items-end">
      <div className="grid gap-2">
        <Label>ラベル名</Label>
        <Input name="name" placeholder="広告 / SNS / 商品" />
      </div>
      <div className="grid gap-2">
        <Label>色</Label>
        <Input name="color" type="color" defaultValue="#2563eb" />
      </div>
      <SubmitButton>作成</SubmitButton>
      <div className="md:col-span-3">
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

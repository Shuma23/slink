"use client";

import { Trash2 } from "lucide-react";
import { deleteLinkAction } from "@/actions/links";
import { Button } from "@/components/ui/button";

export function DeleteLinkButton({ id, label }: { id: string; label: string }) {
  return (
    <form
      action={deleteLinkAction}
      onSubmit={(event) => {
        const ok = window.confirm(`「${label}」を完全に削除します。クリック履歴やA/B設定も削除されます。`);
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button variant="ghost" size="icon" type="submit" title="削除" className="text-red-600 hover:bg-red-50 hover:text-red-700">
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}

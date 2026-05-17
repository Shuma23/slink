import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LinkCreateForm } from "@/components/app/link-form";
import { Button } from "@/components/ui/button";

export default function NewLinkPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost">
        <Link href="/dashboard/links">
          <ChevronLeft className="h-4 w-4" />
          リンク一覧へ
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-semibold">新規リンク</h1>
        <p className="mt-1 text-sm text-slate-500">URL、slug、OGP情報を設定して短縮URLを作成します。</p>
      </div>
      <LinkCreateForm />
    </div>
  );
}

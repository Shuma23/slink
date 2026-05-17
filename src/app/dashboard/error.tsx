"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard route error", error);
  }, [error]);

  return (
    <div className="rounded-lg border border-red-100 bg-white p-6 shadow-sm">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-red-600">ページを読み込めませんでした</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">サーバーエラーが発生しました</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          認証またはデータ取得で問題が起きています。再読み込みしても直らない場合は、下のエラー内容を確認してください。
        </p>
        <pre className="mt-4 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-6 text-white">
          {error.message || error.digest || "Unknown error"}
        </pre>
        <Button type="button" className="mt-4" onClick={reset}>
          再読み込み
        </Button>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LandingPageBuilder } from "@/components/app/landing-page-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewLandingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost">
        <Link href="/dashboard/pages">
          <ChevronLeft className="h-4 w-4" />
          ページ一覧へ
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-semibold">ランディングページ作成</h1>
        <p className="mt-1 text-sm text-slate-500">
          SNS、Webサイト、商品リンクを集約したプロフィールページを作成します。
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ページ設定</CardTitle>
        </CardHeader>
        <CardContent>
          <LandingPageBuilder />
        </CardContent>
      </Card>
    </div>
  );
}

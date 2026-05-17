import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLandingPages } from "@/lib/data";
import { absoluteUrl, formatDate } from "@/lib/utils";

export default async function LandingPagesPage() {
  const pages = await getLandingPages();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold">ランディングページ</h1>
          <p className="mt-1 text-sm text-slate-500">プロフィールリンクページを作成・管理できます。</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/pages/new">新規ページ</Link>
        </Button>
      </div>

      {pages.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{page.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{page.bio || "Bio未設定"}</p>
                    <a href={absoluteUrl(`/p/${page.slug}`)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 break-all text-sm text-blue-700">
                      {absoluteUrl(`/p/${page.slug}`)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Badge>{page.is_active ? "有効" : "無効"}</Badge>
                </div>
                <p className="mt-4 text-xs text-slate-500">作成日: {formatDate(page.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-sm text-slate-500">
            プロフィールリンクページはまだありません。
          </CardContent>
        </Card>
      )}
    </div>
  );
}

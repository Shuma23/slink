import Link from "next/link";
import { Activity, Link2, MousePointerClick, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClickLineChart, DeviceBarChart } from "@/components/app/analytics-chart";
import { getDashboardStats } from "@/lib/data";
import { absoluteUrl, formatDate, toShortNumber } from "@/lib/utils";

export default async function DashboardPage() {
  let stats;

  try {
    stats = await getDashboardStats();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("Failed to load dashboard", error);
    return <DashboardLoadError message={message} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold">ダッシュボード</h1>
          <p className="mt-1 text-sm text-slate-500">リンクの作成状況と直近のクリックを確認できます。</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/links/new">短縮URLを作成</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="総クリック数" value={toShortNumber(stats.clicksCount)} icon={MousePointerClick} />
        <MetricCard title="作成リンク数" value={stats.linksCount.toString()} icon={Link2} />
        <MetricCard title="有効リンク" value={stats.activeLinksCount.toString()} icon={Radio} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>日別クリック推移</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.dailyClicks.length ? (
              <ClickLineChart data={stats.dailyClicks} />
            ) : (
              <EmptyText>クリックデータはまだありません。</EmptyText>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>デバイス別クリック</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.deviceRows.length ? <DeviceBarChart data={stats.deviceRows} /> : <EmptyText>データ待ちです。</EmptyText>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>人気リンク</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.popularLinks.length ? (
              stats.popularLinks.map((link) => (
                <Link
                  key={link.id}
                  href={`/dashboard/links/${link.id}`}
                  className="flex items-center justify-between rounded-md border border-slate-100 p-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{link.title || link.slug}</p>
                    <p className="truncate text-xs text-slate-500">{absoluteUrl(`/${link.path_type}/${link.slug}`)}</p>
                  </div>
                  <Badge>{link.clicks_count} clicks</Badge>
                </Link>
              ))
            ) : (
              <EmptyText>リンクを作るとここに表示されます。</EmptyText>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>直近クリック</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentClicks.length ? (
              stats.recentClicks.map((click) => (
                <div key={click.id} className="rounded-md border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate font-medium">
                      {click.link?.title || click.link?.slug || "unknown link"}
                    </p>
                    <Badge>{click.country || "N/A"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(click.clicked_at)} / {click.device_type || "unknown"} / {click.browser || "browser"}
                  </p>
                </div>
              ))
            ) : (
              <EmptyText>直近クリックはまだありません。</EmptyText>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardLoadError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-100 bg-white p-6 shadow-sm">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-red-600">ダッシュボードを読み込めませんでした</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Supabaseまたは認証連携の設定を確認してください</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          ログインは完了していますが、ダッシュボード用データの取得でエラーになりました。
          開発中は下の詳細をもとにSupabaseのRLS、Clerk連携、環境変数を確認してください。
        </p>
        <pre className="mt-4 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-6 text-white">
          {message}
        </pre>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Activity }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">{children}</div>;
}

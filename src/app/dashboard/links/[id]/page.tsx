import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import {
  archiveLinkAction,
  attachLabelAction,
  detachLabelAction,
} from "@/actions/links";
import { DestinationCreateForm, DestinationRows } from "@/components/app/destinations-panel";
import { ExportComingSoonButton, LinkMetaForm, SingleDestinationForm } from "@/components/app/link-form";
import { OgpPanel } from "@/components/app/ogp-panel";
import { QrPanel } from "@/components/app/qr-panel";
import { ClickLineChart, DeviceBarChart } from "@/components/app/analytics-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLinkDetail } from "@/lib/data";
import { absoluteUrl, formatDate } from "@/lib/utils";

type LinkDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function LinkDetailPage({ params }: LinkDetailProps) {
  const { id } = await params;
  const { link, destinations, clicks, labels, allLabels } = await getLinkDetail(id);
  const shortUrl = absoluteUrl(`/${link.path_type}/${link.slug}`);
  const isAbMode = destinations.length > 0;
  const dailyClicks = clicks.reduce<Map<string, number>>((map, click) => {
    const key = click.clicked_at.slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map());
  const deviceRows = clicks.reduce<Map<string, number>>((map, click) => {
    const key = click.device_type || "unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map());

  const attachedLabelIds = new Set(labels.map((label) => label.id));
  const unattachedLabels = allLabels.filter((label) => !attachedLabelIds.has(label.id));

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link href="/dashboard/links">
          <ChevronLeft className="h-4 w-4" />
          リンク一覧へ
        </Link>
      </Button>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-3xl font-semibold">{link.title || link.slug}</h1>
            <Badge className={link.is_active ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-500"}>
              {link.is_archived ? "アーカイブ" : link.is_active ? "有効" : "無効"}
            </Badge>
          </div>
          <a href={shortUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 break-all text-sm text-blue-700">
            {shortUrl}
            <ExternalLink className="h-3 w-3" />
          </a>
          <p className="mt-1 break-all text-sm text-slate-500">{link.original_url}</p>
        </div>
        <div className="flex gap-2">
          <ExportComingSoonButton />
          <form action={archiveLinkAction}>
            <input type="hidden" name="id" value={link.id} />
            <input type="hidden" name="archive" value={(!link.is_archived).toString()} />
            <Button type="submit" variant="outline">
              {link.is_archived ? "復元" : "アーカイブ"}
            </Button>
          </form>
        </div>
      </div>

      <Tabs defaultValue="routing">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="routing">配信設定</TabsTrigger>
          <TabsTrigger value="overview">基本設定</TabsTrigger>
          <TabsTrigger value="analytics">アナリティクス</TabsTrigger>
          <TabsTrigger value="qr">QR</TabsTrigger>
          <TabsTrigger value="ogp">OGP</TabsTrigger>
        </TabsList>

        <TabsContent value="routing">
          <Card>
            <CardHeader>
              <CardTitle>配信モード</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                現在のモード:{" "}
                <span className="font-semibold text-slate-950">
                  {isAbMode ? "A/Bテストモード" : "通常モード"}
                </span>
                <br />
                A/B遷移先が1件以上ある場合はA/Bテストモードになり、通常URLはリダイレクトに使われません。
                A/B遷移先をすべて削除すると通常モードに戻ります。
              </div>
              <Tabs defaultValue={isAbMode ? "ab" : "single"}>
                <TabsList>
                  <TabsTrigger value="single">通常モード</TabsTrigger>
                  <TabsTrigger value="ab">A/Bテストモード</TabsTrigger>
                </TabsList>
                <TabsContent value="single">
                  <SingleDestinationForm link={link} disabled={isAbMode} />
                </TabsContent>
                <TabsContent value="ab">
                  <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
                    <DestinationCreateForm linkId={link.id} count={destinations.length} />
                    <DestinationRows destinations={destinations} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader>
                <CardTitle>基本設定</CardTitle>
              </CardHeader>
              <CardContent>
                <LinkMetaForm link={link} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>ラベル</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {labels.length ? (
                    labels.map((label) => (
                      <form key={label.id} action={detachLabelAction}>
                        <input type="hidden" name="link_id" value={link.id} />
                        <input type="hidden" name="label_id" value={label.id} />
                        <button type="submit">
                          <Badge style={{ color: label.color, borderColor: label.color }}>{label.name} x</Badge>
                        </button>
                      </form>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">ラベル未設定です。</p>
                  )}
                </div>
                <form action={attachLabelAction} className="flex gap-2">
                  <input type="hidden" name="link_id" value={link.id} />
                  <select name="label_id" className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm">
                    {unattachedLabels.map((label) => (
                      <option key={label.id} value={label.id}>
                        {label.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="outline" disabled={!unattachedLabels.length}>
                    追加
                  </Button>
                </form>
                <div className="rounded-md border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                  ラベル別レポートは準備中です。
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>日別クリック</CardTitle>
              </CardHeader>
              <CardContent>
                <ClickLineChart data={Array.from(dailyClicks.entries()).map(([date, value]) => ({ date, clicks: value }))} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>デバイス / ブラウザ / OS</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceBarChart data={Array.from(deviceRows.entries()).map(([name, value]) => ({ name, value }))} />
              </CardContent>
            </Card>
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>直近クリック</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {clicks.slice(0, 20).map((click) => (
                  <div key={click.id} className="grid gap-1 rounded-md border border-slate-100 p-3 text-sm md:grid-cols-4">
                    <span>{formatDate(click.clicked_at)}</span>
                    <span>{click.referrer || "direct"}</span>
                    <span>{click.device_type || "unknown"} / {click.browser || "-"}</span>
                    <span>{click.country || "N/A"} / {click.os || "-"}</span>
                  </div>
                ))}
                {!clicks.length && <p className="text-sm text-slate-500">クリックデータはまだありません。</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="qr">
          <Card>
            <CardHeader>
              <CardTitle>QRコード</CardTitle>
            </CardHeader>
            <CardContent>
              <QrPanel url={shortUrl} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ogp">
          <Card>
            <CardHeader>
              <CardTitle>OGPプレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <OgpPanel link={link} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

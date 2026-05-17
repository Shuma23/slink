import Link from "next/link";
import {
  Activity,
  Archive,
  BarChart3,
  Brush,
  Gauge,
  ImageIcon,
  Layers3,
  Link2,
  LockKeyhole,
  QrCode,
  Smartphone,
  Tags,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { SlinkLogo } from "@/components/app/slink-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { title: "カスタム短縮URL", icon: Link2, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "詳細アナリティクス", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "A/Bテスト機能", icon: Activity, color: "text-violet-600", bg: "bg-violet-50" },
  { title: "QRコード生成", icon: QrCode, color: "text-amber-600", bg: "bg-amber-50" },
  { title: "ランディングページ作成", icon: Layers3, color: "text-rose-600", bg: "bg-rose-50" },
  { title: "OGP画像プレビュー", icon: ImageIcon, color: "text-cyan-600", bg: "bg-cyan-50" },
  { title: "ラベル管理", icon: Tags, color: "text-lime-700", bg: "bg-lime-50" },
  { title: "アーカイブ機能", icon: Archive, color: "text-slate-600", bg: "bg-slate-100" },
  { title: "セキュア認証", icon: LockKeyhole, color: "text-red-600", bg: "bg-red-50" },
  { title: "カスタムデザイン", icon: Brush, color: "text-fuchsia-600", bg: "bg-fuchsia-50" },
  { title: "高速レスポンス", icon: Gauge, color: "text-orange-600", bg: "bg-orange-50" },
  { title: "モバイル対応", icon: Smartphone, color: "text-sky-600", bg: "bg-sky-50" },
];

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/">
            <SlinkLogo />
          </Link>
          <nav className="flex items-center gap-2">
            {!userId ? (
              <>
              <Button asChild variant="ghost">
                <Link href="/sign-in">ログイン</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">無料で始める</Link>
              </Button>
              </>
            ) : (
              <>
              <Button asChild variant="outline">
                <Link href="/dashboard">ダッシュボード</Link>
              </Button>
              <UserButton />
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_0.9fr] md:items-center md:py-20">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            Links, QR, Analytics in one dashboard
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            短縮URLを作り、測り、改善するためのリンク管理サービス。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            Clerk認証、Supabase RLS、A/Bテスト、QRコード、OGPプレビュー、プロフィールページを一つの管理画面に集約します。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">ダッシュボードへ</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#features">機能を見る</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Today</p>
              <p className="text-2xl font-semibold">12,480 clicks</p>
            </div>
            <div className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              +18.4%
            </div>
          </div>
          <div className="grid grid-cols-7 items-end gap-2">
            {[36, 48, 42, 64, 58, 86, 74].map((height, index) => (
              <div key={index} className="rounded-t bg-blue-500/80" style={{ height }} />
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {["/s/spring-sale", "/t/line-campaign", "/p/creator-kit"].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                <div>
                  <p className="font-medium">{item}</p>
                  <p className="text-xs text-slate-500">A/B destination {index + 1}</p>
                </div>
                <QrCode className="h-5 w-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-slate-100 bg-slate-50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-semibold">必要な機能を最初から。</h2>
            <p className="mt-3 text-slate-600">
              作成、運用、分析、改善のサイクルを、モバイルでも扱いやすいカード型UIで提供します。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-slate-200">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <span className={`grid h-11 w-11 place-items-center rounded-md ${feature.bg}`}>
                      <Icon className={`h-5 w-5 ${feature.color}`} />
                    </span>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-slate-600">
                      運用に必要な状態管理、保存、プレビュー、拡張ポイントを備えた実装として提供します。
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

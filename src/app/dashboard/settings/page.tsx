import { auth } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const { userId } = await auth.protect();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">アカウント設定</h1>
        <p className="mt-1 text-sm text-slate-500">Clerkのユーザープロフィールと認証設定を管理します。</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>認証情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">Clerk userId: {userId}</p>
          <div className="rounded-md border border-dashed border-slate-200 p-3 text-sm text-slate-500">
            Facebook / TwitterログインはClerkのSocial Connectionsを追加すれば拡張できます。
          </div>
          <div className="rounded-md border border-dashed border-slate-200 p-3 text-sm text-slate-500">
            PWA / オフライン対応は準備中です。
          </div>
        </CardContent>
      </Card>
      <UserProfile routing="hash" />
    </div>
  );
}

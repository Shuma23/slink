import { auth } from "@clerk/nextjs/server";
import { DashboardNav } from "@/components/app/dashboard-nav";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await auth.protect();
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <DashboardNav />
      <main className="min-w-0 flex-1 p-4 md:p-8">
        {!supabaseReady && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Supabase環境変数が未設定です。</p>
            <p className="mt-1">
              `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`、
              リダイレクト計測用に `SUPABASE_SERVICE_ROLE_KEY` を設定すると、DB連携が有効になります。
            </p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

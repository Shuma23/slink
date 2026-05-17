import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BarChart3, Link2, Settings, Tags, PanelsTopLeft, Plus } from "lucide-react";
import { SlinkLogo } from "@/components/app/slink-logo";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "概要", icon: BarChart3 },
  { href: "/dashboard/links", label: "リンク", icon: Link2 },
  { href: "/dashboard/labels", label: "ラベル", icon: Tags },
  { href: "/dashboard/pages", label: "ページ", icon: PanelsTopLeft },
  { href: "/dashboard/settings", label: "設定", icon: Settings },
];

export function DashboardNav() {
  return (
    <aside className="border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <SlinkLogo />
          </Link>
          <UserButton />
        </div>
        <Button asChild className="w-full">
          <Link href="/dashboard/links/new">
            <Plus className="h-4 w-4" />
            新規リンク
          </Link>
        </Button>
        <nav className="grid gap-1 md:mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

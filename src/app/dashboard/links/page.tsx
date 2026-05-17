import Link from "next/link";
import { Archive, ExternalLink, RotateCcw } from "lucide-react";
import { archiveLinkAction, toggleLinkActiveAction } from "@/actions/links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/app/copy-link-button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLabels, getLinks } from "@/lib/data";
import { absoluteUrl, formatDate } from "@/lib/utils";

type LinksPageProps = {
  searchParams: Promise<{
    q?: string;
    archived?: string;
    label?: string;
  }>;
};

export default async function LinksPage({ searchParams }: LinksPageProps) {
  const params = await searchParams;
  const includeArchived = params.archived === "true";
  const [links, labels] = await Promise.all([
    getLinks({ includeArchived, q: params.q, labelId: params.label }),
    getLabels(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold">リンク一覧</h1>
          <p className="mt-1 text-sm text-slate-500">検索、ラベル、アーカイブ状態で管理できます。</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/links/new">新規リンク</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_160px_auto]">
            <Input name="q" placeholder="slug / title / URLで検索" defaultValue={params.q ?? ""} />
            <select
              name="label"
              defaultValue={params.label ?? ""}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">すべてのラベル</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
            <select
              name="archived"
              defaultValue={includeArchived ? "true" : "false"}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="false">通常のみ</option>
              <option value="true">アーカイブ含む</option>
            </select>
            <Button type="submit">絞り込み</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {links.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>リンク</TableHead>
                  <TableHead>ラベル</TableHead>
                  <TableHead>クリック</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id} className="align-middle">
                    <TableCell className="align-middle">
                      <Link href={`/dashboard/links/${link.id}`} className="font-medium hover:underline">
                        {link.title || link.slug}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>{absoluteUrl(`/${link.path_type}/${link.slug}`)}</span>
                        <CopyLinkButton value={absoluteUrl(`/${link.path_type}/${link.slug}`)} label="短縮URLをコピー" />
                        <a href={`/${link.path_type}/${link.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-wrap items-center gap-1">
                        {link.labels.length ? (
                          link.labels.map((label) => (
                            <Badge key={label.id} style={{ borderColor: label.color, color: label.color }}>
                              {label.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">なし</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">{link.clicks_count}</TableCell>
                    <TableCell className="align-middle">
                      <Badge className={link.is_active ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-500"}>
                        {link.is_archived ? "アーカイブ" : link.is_active ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle">{formatDate(link.created_at)}</TableCell>
                    <TableCell className="align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <form action={toggleLinkActiveAction}>
                          <input type="hidden" name="id" value={link.id} />
                          <input type="hidden" name="is_active" value={(!link.is_active).toString()} />
                          <Button variant="outline" size="sm" type="submit">
                            {link.is_active ? "無効化" : "有効化"}
                          </Button>
                        </form>
                        <form action={archiveLinkAction}>
                          <input type="hidden" name="id" value={link.id} />
                          <input type="hidden" name="archive" value={(!link.is_archived).toString()} />
                          <Button variant="ghost" size="icon" type="submit" title={link.is_archived ? "復元" : "アーカイブ"}>
                            {link.is_archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-10 text-center text-sm text-slate-500">条件に一致するリンクはありません。</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

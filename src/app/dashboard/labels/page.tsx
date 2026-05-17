import { deleteLabelAction } from "@/actions/labels";
import { LabelForm } from "@/components/app/label-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLabels } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function LabelsPage() {
  const labels = await getLabels();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">ラベル管理</h1>
        <p className="mt-1 text-sm text-slate-500">短縮URLを分類し、一覧画面でフィルタリングできます。</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>新規ラベル</CardTitle>
        </CardHeader>
        <CardContent>
          <LabelForm />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {labels.length ? (
            <div className="divide-y divide-slate-100">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <Badge style={{ color: label.color, borderColor: label.color }}>{label.name}</Badge>
                    <p className="mt-2 text-xs text-slate-500">作成日: {formatDate(label.created_at)}</p>
                  </div>
                  <form action={deleteLabelAction}>
                    <input type="hidden" name="id" value={label.id} />
                    <Button type="submit" variant="ghost" size="sm">削除</Button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-500">ラベルはまだありません。</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

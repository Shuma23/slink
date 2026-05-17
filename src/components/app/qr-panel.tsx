"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const logoOptions = [
  { label: "なし", value: "" },
  { label: "Instagram", value: "/logos/qr-instagram.png" },
  { label: "LINE", value: "/logos/qr-line.png" },
  { label: "X", value: "/logos/qr-x.png" },
];

export function QrPanel({ url }: { url: string }) {
  const [size, setSize] = useState(280);
  const [dark, setDark] = useState("#111827");
  const [light, setLight] = useState("#ffffff");
  const [logoUrl, setLogoUrl] = useState("");
  const [png, setPng] = useState("");

  const options = useMemo(
    () => ({
      width: size,
      margin: 4,
      errorCorrectionLevel: "H" as const,
      color: { dark, light },
    }),
    [dark, light, size],
  );

  useEffect(() => {
    let cancelled = false;

    async function renderQr() {
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, url, options);

      const context = canvas.getContext("2d");
      if (!context || !logoUrl) {
        applyImageCornerRadius(canvas);
        if (!cancelled) setPng(canvas.toDataURL("image/png"));
        return;
      }

      const logo = await loadImage(logoUrl);
      if (cancelled) return;

      const x = Math.round((canvas.width - logo.naturalWidth) / 2);
      const y = Math.round((canvas.height - logo.naturalHeight) / 2);
      context.drawImage(logo, x, y);
      applyImageCornerRadius(canvas);

      setPng(canvas.toDataURL("image/png"));
    }

    renderQr().catch(() => {
      if (!cancelled) setPng("");
    });

    return () => {
      cancelled = true;
    };
  }, [logoUrl, options, url]);

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="grid min-h-80 place-items-center rounded-md border border-slate-200 bg-white p-4">
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={png}
            alt="QR code"
            className="h-auto max-w-full rounded-lg"
            style={{ width: Math.min(size, 320) }}
          />
        ) : (
          <div className="text-sm text-slate-500">QRコードを生成中...</div>
        )}
      </div>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>サイズ</Label>
          <Input
            type="number"
            min={280}
            max={1024}
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>前景色</Label>
            <Input type="color" value={dark} onChange={(event) => setDark(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>背景色</Label>
            <Input type="color" value={light} onChange={(event) => setLight(event.target.value)} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label>中央ロゴ</Label>
          <select
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            {logoOptions.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-slate-500">
            ロゴ画像をそのまま中央に重ねます。PNG画像自体はプレビューと同じ角丸で保存します。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={!png}
          onClick={() => downloadPng(png)}
        >
          <Download className="h-4 w-4" />
          PNGをダウンロード
        </Button>
      </div>
    </div>
  );
}

function downloadPng(dataUrl: string) {
  if (!dataUrl) return;

  const byteString = atob(dataUrl.split(",")[1] ?? "");
  const mimeType = dataUrl.match(/^data:(.*?);base64,/)?.[1] ?? "image/png";
  const bytes = new Uint8Array(byteString.length);

  for (let index = 0; index < byteString.length; index += 1) {
    bytes[index] = byteString.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: mimeType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = "qrcode.png";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function applyImageCornerRadius(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const radius = Math.max(8, Math.round(canvas.width * 0.035));
  context.save();
  context.globalCompositeOperation = "destination-in";
  context.beginPath();
  context.moveTo(radius, 0);
  context.lineTo(canvas.width - radius, 0);
  context.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
  context.lineTo(canvas.width, canvas.height - radius);
  context.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
  context.lineTo(radius, canvas.height);
  context.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
  context.lineTo(0, radius);
  context.quadraticCurveTo(0, 0, radius, 0);
  context.closePath();
  context.fill();
  context.restore();
}

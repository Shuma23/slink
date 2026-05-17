import { cn } from "@/lib/utils";

export function SlinkLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/slink-mark.svg" alt="" className="h-8 w-8 rounded-md" />
      <span>SLINK</span>
    </span>
  );
}

"use client";

export function ActionMessage({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state?.message) return null;

  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
      {state.message}
    </p>
  );
}

import React from 'react';

export const inputCls =
  'w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm px-4 py-2.5 transition';

export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50 text-neutral-200 text-sm px-3 py-2.5 transition';

export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-red-900/60 bg-red-950/40 hover:bg-red-900/50 active:scale-[0.98] text-red-300 text-sm px-3 py-2.5 transition';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-400 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-neutral-500 mt-1">{hint}</span>}
    </label>
  );
}

"use client";

import { Sparkles, X, HeartPulse } from "lucide-react";
import type { HealthTip } from "@/lib/health-tips";

type HealthTipPopupProps = {
  tip: HealthTip | null;
  onDismiss: () => void;
};

export function HealthTipPopup({ tip, onDismiss }: HealthTipPopupProps) {
  if (!tip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" aria-live="polite">
      <button
        type="button"
        aria-label="Dismiss health tip backdrop"
        onClick={onDismiss}
        className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-md"
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-cyan-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.26)] ring-1 ring-cyan-100">
        <div className="flex items-start gap-4 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(20,184,166,0.08))] p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-200">
            <HeartPulse size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-700">
              <Sparkles size={12} /> Daily health tip
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{tip.title}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">{tip.category}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{tip.message}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Dismiss health tip"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4 text-xs text-slate-500">
          <span>New tip on each login until the set cycles.</span>
          <span className="rounded-full bg-cyan-50 px-2 py-1 font-semibold text-cyan-700">Stay healthy</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { SkeletonBlock } from "./skeleton";

/* ------------------------------------------------------------------ *
 * Design system — shared visual tokens (class strings)
 * One source of truth so every dashboard page looks like one product.
 * ------------------------------------------------------------------ */
export const ui = {
  // Surfaces
  panel: "rounded-2xl border border-[var(--panel-border)] bg-white shadow-sm",
  card: "rounded-xl border border-[var(--panel-border)] bg-white shadow-xs",
  subtle: "rounded-lg border border-[var(--panel-border)] bg-[var(--bg-soft)]",
  // Typography
  kicker: "text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]",
  pageTitle: "text-3xl font-bold tracking-tight text-[var(--text)]",
  sectionTitle: "text-lg font-bold text-[var(--text)]",
  cardTitle: "text-sm font-semibold text-[var(--text)]",
  body: "text-sm text-[var(--text)]",
  muted: "text-sm text-[var(--muted)]",
  meta: "text-xs text-[var(--muted)]",
  label: "text-xs font-medium uppercase tracking-wide text-[var(--muted)]",
  // Controls
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--panel-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-50",
  btnGhost:
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)] disabled:opacity-50",
  btnDanger:
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50",
  input:
    "w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg-soft)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 disabled:opacity-60",
  chip: "inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--accent)]",
  iconBadge:
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]",
  modalOverlay: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm",
  modalCard: "w-full max-w-md rounded-2xl border border-[var(--panel-border)] bg-white p-6 shadow-lg",
} as const;

export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={`${ui.panel} p-6 ${className}`}>
      {children}
    </section>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`${ui.card} p-4 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {kicker ? <p className={ui.kicker}>{kicker}</p> : null}
        <h1 className={`${kicker ? "mt-2" : ""} ${ui.pageTitle}`}>{title}</h1>
        {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className={ui.kicker}>{title}</p>
        {subtitle ? (
          <h2 className={`mt-2 ${ui.sectionTitle}`}>{subtitle}</h2>
        ) : null}
      </div>
      {action ? <div className="pt-0.5">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, className = "", action }: { title: string; description: string; className?: string; action?: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-dashed border-[var(--panel-border)] bg-[var(--bg-soft)] p-8 text-center ${className}`}>
      <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--panel-border)] ${className}`} />;
}

export function LoadingSection({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <Card className={className}>
      <SkeletonBlock rows={lines} />
    </Card>
  );
}

export function GoalProgressRing({
  value,
  target,
  size = 84,
  strokeWidth = 10,
  color = "blue",
}: {
  value: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  color?: "blue" | "emerald" | "amber" | "violet";
}) {
  const safeTarget = target > 0 ? target : 1;
  const safeValue = Math.max(0, Math.min(value, safeTarget));
  const percentage = Math.min(100, Math.max(0, (safeValue / safeTarget) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * percentage) / 100;

  const palette = {
    blue: {
      track: "stroke-slate-200",
      progress: "stroke-blue-500",
      glow: "drop-shadow-[0_0_6px_rgba(59,130,246,0.18)]",
      text: "text-blue-700",
    },
    emerald: {
      track: "stroke-slate-200",
      progress: "stroke-emerald-500",
      glow: "drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]",
      text: "text-emerald-700",
    },
    amber: {
      track: "stroke-slate-200",
      progress: "stroke-amber-500",
      glow: "drop-shadow-[0_0_10px_rgba(245,158,11,0.35)]",
      text: "text-amber-700",
    },
    violet: {
      track: "stroke-slate-200",
      progress: "stroke-violet-500",
      glow: "drop-shadow-[0_0_10px_rgba(139,92,246,0.35)]",
      text: "text-violet-700",
    },
  }[color];

  // Make the visual treatment more subtle for small sizes and avoid a heavy glow overlay
  const showGlow = size >= 64;
  const labelSize = Math.max(10, Math.round(size * 0.22));

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={showGlow ? palette.glow : undefined}
        aria-label={`Progress ${Math.round(percentage)} percent`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={`fill-none ${palette.track}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={`fill-none ${palette.progress}`}
        />
      </svg>

      {/* inner label with subtle white background to remove halo overlap */}
      <div
        className="absolute flex items-center justify-center bg-white"
        style={{ width: Math.max(20, Math.round(size * 0.5)), height: Math.max(20, Math.round(size * 0.5)), borderRadius: Math.round(size * 0.5) }}
      >
        <span className={`font-bold ${palette.text}`} style={{ fontSize: labelSize }}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

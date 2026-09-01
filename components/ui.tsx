"use client";

import React from "react";
import { SkeletonBlock } from "./skeleton";

export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-[2rem] border border-[var(--panel-border)] bg-white/80 p-6 backdrop-blur-xl ${className}`}>{children}</section>;
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-[1.8rem] border border-[var(--panel-border)] bg-[var(--bg-soft)] p-4 ${className}`}>{children}</div>;
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">{title}</p>
        {subtitle ? <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, className = "" }: { title: string; description: string; className?: string }) {
  return (
    <div className={`rounded-[1.8rem] border border-[var(--panel-border)] bg-[var(--bg-soft)] p-6 text-sm text-[var(--muted)] ${className}`}>
      <p className="font-semibold text-[var(--text)]">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
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
        className="absolute flex items-center justify-center"
        style={{ width: Math.max(20, Math.round(size * 0.5)), height: Math.max(20, Math.round(size * 0.5)), borderRadius: Math.round(size * 0.5), background: "white" }}
      >
        <span className={`font-bold ${palette.text}`} style={{ fontSize: labelSize }}>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

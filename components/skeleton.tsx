"use client";

import React from "react";

export function Skeleton({ className = "h-4 w-full rounded bg-slate-200/60", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`animate-pulse ${className}`}>{children}</div>;
}

export function SkeletonBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 w-full rounded bg-slate-200/60 animate-pulse"></div>
      ))}
    </div>
  );
}

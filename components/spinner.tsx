"use client";

import React from "react";

export default function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      role="img"
      aria-label="loading"
      className={`animate-spin inline-block align-middle ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

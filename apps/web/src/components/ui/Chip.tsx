"use client";

import type { ReactNode } from "react";

export default function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border bg-white ${className}`}>
      {children}
    </span>
  );
}

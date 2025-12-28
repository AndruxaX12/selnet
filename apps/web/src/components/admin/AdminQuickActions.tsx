"use client";
import { useState } from "react";

const STATUSES = ["in_progress", "resolved", "rejected", "overdue"] as const;

export default function AdminQuickActions({ signalId, canModerate }: { signalId: string; canModerate: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!canModerate) return null;

  async function setStatus(s: string) {
    setBusy(s);
    try {
      const res = await fetch(`/api/signals/${signalId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s })
      });
      if (!res.ok) throw new Error(await res.text());
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="text-sm font-medium">Админ действия</div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s}
            disabled={!!busy}
            onClick={() => setStatus(s)}
            className="rounded border px-3 py-1 text-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            {busy === s ? "…" : `Статус: ${s}`}
          </button>
        ))}
      </div>
    </div>
  );
}

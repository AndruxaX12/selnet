"use client";

export default function MapToolbar({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button onClick={onReset} className="rounded border px-3 py-1">Нулирай филтри</button>
      <span className="text-xs text-neutral-500">Скрол за zoom, рисуване за полигон</span>
    </div>
  );
}

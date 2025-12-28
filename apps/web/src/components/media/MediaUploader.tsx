"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { compressImage } from "@/lib/image-compress";
import { uploadImages } from "@/lib/upload";
import { Photo } from "@selnet/shared";

type Props = {
  pathPrefix: string;          // напр. "signals/{docId}"
  maxFiles?: number;           // default 12
  maxInputSizeMB?: number;     // default 12
  accept?: string;             // default "image/*"
  onDone?: (photos: Photo[]) => void;
};

type Item = {
  file: File;
  previewUrl: string;
  status: "queued" | "compressing" | "uploading" | "done" | "error";
  progress: number; // 0..100
  out?: Photo;
  error?: string;
};

export default function MediaUploader({
  pathPrefix,
  maxFiles = 12,
  maxInputSizeMB = 12,
  accept = "image/*",
  onDone
}: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCount = items.length;
  const canAddMore = selectedCount < maxFiles;

  const onSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, maxFiles - selectedCount);
    const add: Item[] = arr.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: "queued",
      progress: 0
    }));
    setItems((prev) => [...prev, ...add]);
  }, [maxFiles, selectedCount]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!canAddMore) return;
    onSelect(e.dataTransfer.files);
  }, [onSelect, canAddMore]);

  const onBrowseClick = useCallback(() => inputRef.current?.click(), []);

  async function startUpload() {
    if (busy || !items.length) return;
    setBusy(true);
    try {
      // Паралел ≤ 3
      const queue = [...items];
      const results: Photo[] = [];
      const workers = Array.from({ length: 3 }, () => worker());

      await Promise.all(workers);

      onDone?.(results);

      async function worker() {
        while (queue.length) {
          const index = items.findIndex((it) => it.status === "queued");
          if (index === -1) return;
          await processItem(index);
        }
      }

      async function processItem(index: number) {
        // 1) Валидации
        const it = items[index];
        if (!it) return;
        if (!it.file.type.startsWith("image/")) {
          mark(index, "error", 0, "Неподдържан тип");
          return;
        }
        if (it.file.size > maxInputSizeMB * 1024 * 1024) {
          mark(index, "error", 0, `Файлът е над ${maxInputSizeMB}MB` );
          return;
        }

        mark(index, "compressing", 5);
        // 2) Компресия
        const blob = await compressImage(it.file).catch(() => it.file);
        const outFile = new File([blob], it.file.name.replace(/\.(\w+)$/, "") + ".webp", { type: blob.type || "image/webp" });

        // 3) Качване
        mark(index, "uploading", 10);
        const photos = await uploadImages([outFile], pathPrefix);
        mark(index, "done", 100, undefined, photos[0]);
        results.push(photos[0]);
      }

      function mark(i: number, status: Item["status"], progress: number, error?: string, out?: Photo) {
        setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, status, progress, error, out } : x)));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop зона */}
      <div
        onDragOver={(e)=>e.preventDefault()}
        onDrop={onDrop}
        className={`rounded border-2 border-dashed p-6 text-center ${canAddMore ? "hover:bg-neutral-50" : "opacity-60"}` }
      >
        <div className="text-sm">Провлачете изображения тук</div>
        <div className="text-xs text-neutral-500 mt-1">или</div>
        <button type="button" onClick={onBrowseClick} className="mt-2 rounded border px-3 py-1 text-sm">
          Избери файлове
        </button>
        <input ref={inputRef} type="file" accept={accept} multiple hidden onChange={(e)=>onSelect(e.target.files)} />
        <div className="text-xs text-neutral-500 mt-2">До {maxFiles} файла, максимум {maxInputSizeMB}MB на файл.</div>
      </div>

      {/* Списък с качвания */}
      {!!items.length && (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-3 rounded border p-2">
              <img src={it.previewUrl} className="h-16 w-16 object-cover rounded border" alt="" />
              <div className="flex-1">
                <div className="text-xs">{it.file.name}</div>
                <div className="h-2 w-full bg-neutral-100 rounded mt-1 overflow-hidden">
                  <div className="h-full bg-black" style={{ width: `${it.progress}%`  }} />
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  {it.status === "queued" && "В опашката"}
                  {it.status === "compressing" && "Компресия…"}
                  {it.status === "uploading" && "Качване…"}
                  {it.status === "done" && "Готово"}
                  {it.status === "error" && <span className="text-red-600">Грешка: {it.error}</span>}
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <button type="button" onClick={startUpload} disabled={busy} className="rounded bg-black text-white px-3 py-2 text-sm">
              {busy ? "Качване…" : "Качи"}
            </button>
            <button type="button" onClick={()=>setItems([])} disabled={busy} className="rounded border px-3 py-2 text-sm">Изчисти</button>
          </div>
        </div>
      )}
    </div>
  );
}

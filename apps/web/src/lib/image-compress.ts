"use client";

/**
 * Компресира File/Blob в браузъра:
 * - максимална страна: maxSizePx (default 1600)
 * - качество: 0.82 (за JPEG/WebP)
 * - опит първо WebP, иначе JPEG
 */
export async function compressImage(
  file: File,
  opts?: { maxSizePx?: number; quality?: number }
): Promise<Blob> {
  const maxSize = opts?.maxSizePx ?? 1600;
  const quality = opts?.quality ?? 0.82;

  const img = await loadImageFromFile(file);
  const { canvas, type } = drawIntoCanvas(img, maxSize);

  const preferTypes = ["image/webp", "image/jpeg"];
  for (const t of preferTypes) {
    try {
      const blob = await toBlob(canvas, t, quality);
      if (blob) return blob;
    } catch (e) {
      console.warn(`Failed to convert to ${t}`, e);
    }
  }

  // fallback: оригинал
  return file;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read error"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("img error"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function drawIntoCanvas(img: HTMLImageElement, maxSize: number) {
  const { width, height } = img;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, type: "image/webp" as const };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

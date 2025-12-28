"use client";
import imageCompression from "browser-image-compression";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app } from "@/lib/firebase";

export type UploadResult = { url: string; path: string };

export async function compressImage(file: File) {
  return imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1, // ~1MB
    useWebWorker: true,
    initialQuality: 0.9
  });
}

export function uploadWithProgress(file: File, path: string, onProgress: (p: number) => void) {
  const storage = getStorage(app);
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
  return new Promise<UploadResult>((resolve, reject) => {
    task.on("state_changed",
      snap => onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve({ url: await getDownloadURL(task.snapshot.ref), path })
    );
  });
}

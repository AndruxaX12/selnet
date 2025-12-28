"use client";
import { app } from "@/lib/firebase";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export async function uploadAvatar(file: File, uid: string): Promise<string> {
  const storage = getStorage(app);
  const ext = file.name.split(".").pop() || "jpg";
  const path = `avatars/${uid}.${ext}`; // overwrite същото име → винаги последен аватар
  const task = uploadBytesResumable(ref(storage, path), file, {
    cacheControl: "public,max-age=604800,immutable",
    contentType: file.type
  });
  await new Promise<void>((resolve, reject) => {
    task.on("state_changed", undefined, reject, () => resolve());
  });
  return await getDownloadURL(task.snapshot.ref);
}

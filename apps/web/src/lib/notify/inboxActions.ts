"use client";
import { app } from "@/lib/firebase";
import {
  getFirestore,
  doc,
  updateDoc,
  collection,
  getDocs,
  orderBy,
  limit,
  query
} from "firebase/firestore";

export async function markNotificationRead(uid: string, id: string) {
  if (!uid) return;
  const db = getFirestore(app);
  const ref = doc(db, "users", uid, "inbox", id);
  await updateDoc(ref, {
    read: true,
    readAt: Date.now()
  }).catch((error) => {
    console.warn("markNotificationRead: failed", error);
  });
}

export async function markAllNotificationsRead(uid: string) {
  if (!uid) return;
  const db = getFirestore(app);
  const base = collection(db, "users", uid, "inbox");
  const snap = await getDocs(query(base, orderBy("createdAt", "desc"), limit(200))).catch((error) => {
    console.warn("markAllNotificationsRead: fetch failed", error);
    return null;
  });
  if (!snap || snap.empty) return;
  const updates = snap.docs
    .filter((docSnap) => {
      const data = docSnap.data();
      return !data.read;
    })
    .map((docSnap) => updateDoc(docSnap.ref, { read: true, readAt: Date.now() }));
  await Promise.allSettled(updates);
}

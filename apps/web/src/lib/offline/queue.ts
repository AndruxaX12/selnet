"use client";
import { idbGet, getDB } from "@/lib/db/idb";
import { app } from "@/lib/firebase";
import { addDoc, collection, getFirestore } from "firebase/firestore";

export async function queueCreate(coll: "signals"|"ideas"|"events", payload: any) {
  const db = await getDB();
  const id = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}` ;
  await db.put("queue", { id, coll, payload, createdAt: Date.now(), status: "pending" });
  return id;
}

export async function flushQueue() {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  const db = await getDB();
  const all = await db.getAll("queue");
  if (!all.length) return;
  const fs = getFirestore(app);
  for (const q of all) {
    try {
      await addDoc(collection(fs, q.coll), q.payload);
      await db.delete("queue", q.id);
    } catch {/* остави за следващия път */}
  }
}

// регистрация на listener
if (typeof window !== "undefined") {
  window.addEventListener("online", () => { flushQueue(); });
}

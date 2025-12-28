"use client";
import { app } from "@/lib/firebase";
import { deleteDoc, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase";

export async function setRSVP(eventId: string, v: "going"|"interested"|null) {
  const user = auth.currentUser;
  if (!user) throw new Error("not-auth");
  const db = getFirestore(app);
  const ref = doc(db, "events", eventId, "rsvp", user.uid);
  if (!v) { await deleteDoc(ref); return; }
  await setDoc(ref, { by: user.uid, v, at: Date.now() }, { merge: true });
}

export async function myRSVP(eventId: string): Promise<"going"|"interested"|null> {
  const user = auth.currentUser;
  if (!user) return null;
  const db = getFirestore(app);
  const snap = await getDoc(doc(db, "events", eventId, "rsvp", user.uid));
  return snap.exists() ? (snap.data() as any).v : null;
}

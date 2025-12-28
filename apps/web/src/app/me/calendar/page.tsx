"use client";
import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";

export default function MyCalendarFeedPage() {
  const { user } = useAuth();
  const [token, setToken] = useState<string>("");

  useEffect(() => { (async () => {
    if (!user) return;
    const db = getFirestore(app);
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    let t = (snap.data() as any)?.icalToken;
    if (!t) {
      t = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      await updateDoc(ref, { icalToken: t, updatedAt: Date.now() });
    }
    setToken(t);
  })(); }, [user]);

  if (!user) return <div>Не си влязъл.</div>;
  const url = `${location.origin}/api/me/ical?token=${token}` ;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Моят iCal feed</h1>
      <p className="text-sm">Абонирай този URL във вашия календар (Google/Apple/Outlook):</p>
      <pre className="p-2 bg-neutral-50 rounded border text-xs overflow-auto">{url}</pre>
      <p className="text-xs text-neutral-500">Включва събития, за които сте отметнали „Ще присъствам“ или „Интересува ме“.</p>
    </div>
  );
}

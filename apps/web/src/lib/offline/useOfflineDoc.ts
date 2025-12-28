"use client";
import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import { doc, getDoc, getFirestore, onSnapshot } from "firebase/firestore";
import { idbGet, idbPut } from "@/lib/db/idb";

export function useOfflineDoc(coll: "signals"|"ideas"|"events"|"settlements", id: string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOnline(navigator.onLine);
      const on = () => setOnline(true), off = () => setOnline(false);
      window.addEventListener("online", on); window.addEventListener("offline", off);
      return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
    }
  }, []);

  useEffect(() => {
    let unsub: (()=>void)|null = null;
    (async () => {
      const cached = await idbGet(coll, id);
      if (cached) setData(cached);
      setLoading(false);
      if (typeof window === 'undefined' || !navigator.onLine) return;
      const db = getFirestore(app);
      unsub = onSnapshot(doc(db, coll, id), async (snap) => {
        if (!snap.exists()) return setData(null);
        const x = { id: snap.id, ...snap.data() } as any;
        setData(x);
        await idbPut(coll, [{ ...x, updatedAt: x.updatedAt || x.createdAt || Date.now() }]);
      });
    })();
    return () => { if (unsub) unsub(); };
  }, [coll, id]);

  return { data, loading, online };
}

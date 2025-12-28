"use client";
import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import { collection, getDocs, getFirestore, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { idbGetAll, idbPut, idbGetMeta, idbSetMeta } from "@/lib/db/idb";

export function useOfflineList(coll: "signals"|"ideas"|"events", opts?: { pageLimit?: number }) {
  const pageLimit = opts?.pageLimit ?? 100;
  const [items, setItems] = useState<any[]>([]);
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
    let mounted = true;
    
    (async () => {
      try {
        // 1) кеш - бърз достъп
        const cached = await idbGetAll(coll, pageLimit * 2);
        if (mounted && cached.length) {
          setItems(cached.slice(0, pageLimit));
          setLoading(false);
        }

        // 2) network (ако има онлайн) - асинхронно
        if (typeof window === 'undefined' || !navigator.onLine) {
          if (mounted && cached.length === 0) setLoading(false);
          return;
        }

        // Delay network request to not block UI
        setTimeout(async () => {
          if (!mounted) return;
          
          try {
            const db = getFirestore(app);
            const ord = coll === "events" ? orderBy("when","desc") : orderBy("createdAt","desc");
            const q = query(collection(db, coll), ord, limit(pageLimit * 2));
            
            unsub = onSnapshot(q, async (snap) => {
              if (!mounted) return;
              
              const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
              setItems(rows.slice(0, pageLimit));
              setLoading(false);
              
              // Cache in background
              setTimeout(() => {
                idbPut(coll, rows.map(x => ({ ...x, updatedAt: x.updatedAt || x.createdAt || Date.now() })));
              }, 100);
            }, (error) => {
              console.error(`Error fetching ${coll}:`, error);
              if (mounted) setLoading(false);
            });
          } catch (error) {
            console.error(`Error setting up ${coll} listener:`, error);
            if (mounted) setLoading(false);
          }
        }, 100);
        
      } catch (error) {
        console.error(`Error loading ${coll} from cache:`, error);
        if (mounted) setLoading(false);
      }
    })();

    return () => { 
      mounted = false;
      if (unsub) unsub(); 
    };
  }, [coll, pageLimit]);

  return { items, loading, online, lastSyncKey: `ts_${coll}`  };
}

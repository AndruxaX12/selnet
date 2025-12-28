"use client";
import { useEffect, useMemo, useState } from "react";
import { app } from "@/lib/firebase";
import {
  collection, getDocs, getFirestore, limit, orderBy, query, startAfter
} from "firebase/firestore";

type Props = { coll: "signals"|"ideas"|"events"; docId: string; pageSize?: number };

export default function HistoryTimeline({ coll, docId, pageSize = 20 }: Props) {
  const db = useMemo(()=>getFirestore(app), []);
  const base = useMemo(()=>collection(db, coll, docId, "history"), [db, coll, docId]);

  const [items, setItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [coll, docId]);

  async function load(more = false) {
    setLoading(true);
    let q = query(base, orderBy("at","desc"), limit(pageSize));
    if (more && cursor) q = query(base, orderBy("at","desc"), startAfter(cursor), limit(pageSize));
    const snap = await getDocs(q);
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setItems(more ? (prev)=>[...prev, ...rows] : rows);
    setCursor(snap.docs[snap.docs.length-1] || null);
    setLoading(false);
  }

  const badge = (t: string) =>
    t === "status" ? "bg-blue-600" :
    t === "edit" ? "bg-amber-600" :
    t === "photo_mod" ? "bg-purple-600" :
    t === "import" ? "bg-teal-600" :
    "bg-neutral-700";

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium">История</h3>
      <ul className="space-y-2">
        {items.map(it => (
          <li key={it.id} className="rounded border p-3">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{new Date(it.at).toLocaleString()}</span>
              <span className={`text-[10px] uppercase text-white px-2 py-0.5 rounded ${badge(it.type)}` }>{it.type}</span>
            </div>
            <div className="mt-1 text-sm">{it.msg}</div>
            {it.diff && (
              <details className="mt-2">
                <summary className="text-xs underline cursor-pointer">Промени</summary>
                <pre className="text-xs bg-neutral-50 p-2 rounded overflow-auto">{JSON.stringify(it.diff, null, 2)}</pre>
              </details>
            )}
            {it.by && <div className="text-xs text-neutral-500 mt-1">от: {it.by}</div>}
          </li>
        ))}
      </ul>
      {cursor && (
        <div className="text-center">
          <button className="rounded border px-3 py-1.5 text-sm" onClick={()=>load(true)}>Зареди още</button>
        </div>
      )}
      {loading && <div className="text-sm text-neutral-600">Зареждане…</div>}
      {!loading && items.length === 0 && <div className="text-sm text-neutral-600">Няма записи.</div>}
    </div>
  );
}

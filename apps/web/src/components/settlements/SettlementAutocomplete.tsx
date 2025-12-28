"use client";
import { useEffect, useMemo, useState } from "react";
import { app } from "@/lib/firebase";
import { collection, getDocs, getFirestore, limit, orderBy, query } from "firebase/firestore";

type Opt = { 
  id: string; 
  label: string; 
  center?: { lat: number; lng: number }; 
  bounds?: { 
    ne: { lat: number; lng: number }; 
    sw: { lat: number; lng: number } 
  } 
};

export default function SettlementAutocomplete({
  value, onChange, placeholder = "Селище…"
}: { 
  value?: string; 
  onChange: (id: string | null, opt?: Opt) => void; 
  placeholder?: string 
}) {
  const db = useMemo(()=>getFirestore(app), []);
  const [all, setAll] = useState<Opt[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(query(collection(db, "settlements"), orderBy("name", "asc"), limit(2000)));
      setAll(snap.docs.map(d => {
        const x: any = d.data();
        const label = [x.name, x.municipality, x.province].filter(Boolean).join(", ");
        return { 
          id: d.id, 
          label, 
          center: x.center,
          bounds: x.bounds
        };
      }));
    })();
  }, [db]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all.slice(0, 20);
    return all.filter(o => o.label.toLowerCase().includes(s)).slice(0, 20);
  }, [all, q]);

  useEffect(() => {
    if (!value) setQ(""); // ако изчистим стойността
  }, [value]);

  return (
    <div className="relative">
      <input
        className="w-full rounded border px-3 py-2"
        placeholder={placeholder}
        value={q}
        onChange={(e)=>{ setQ(e.target.value); setOpen(true); }}
        onFocus={()=>setOpen(true)}
      />
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded border bg-white shadow">
          {filtered.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(o.id, o); setQ(o.label); setOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-50"
            >
              {o.label}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-neutral-500">Няма съвпадения.</div>}
        </div>
      )}
    </div>
  );
}

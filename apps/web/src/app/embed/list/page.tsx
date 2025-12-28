"use client";
import { useEffect, useState } from "react";

export default function EmbedListPage() {
  const [rows, setRows] = useState<any[]>([]);
  const sp = typeof window !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
  const coll = (sp.get("coll") || "signals");
  const limit = Number(sp.get("limit") || 10);
  const settlementId = sp.get("settlementId") || "";

  useEffect(() => {
    const url = `/api/public/list?coll=${coll}&limit=${limit}${settlementId?`&settlementId=${settlementId}`:""}` ;
    fetch(url).then(r=>r.json()).then(j=>setRows(j.rows||[])).catch(()=>setRows([]));
  }, [coll, limit, settlementId]);

  return (
    <div className="font-sans text-[14px] text-[#111]">
      <ul className="divide-y">
        {rows.map((r:any)=>(
          <li key={r.id} className="p-8">
            <div className="text-xs text-neutral-500">{coll.toUpperCase()}</div>
            <a target="_blank" rel="noopener" href={r.url} className="font-semibold underline">{r.title||"(без заглавие)"}</a>
            {r.settlementLabel && <div className="text-xs text-neutral-500 mt-0.5">{r.settlementLabel}</div>}
            {r.desc && <div className="mt-2">{r.desc}</div>}
          </li>
        ))}
        {rows.length===0 && <li className="p-8 text-neutral-500">Няма данни.</li>}
      </ul>
      <style jsx global>{`
        html,body{margin:0;padding:0}
        a{color:#0a0a0a}
      `}</style>
    </div>
  );
}


"use client";
import { useState } from "react";

export default function EmbedPlayground() {
  const [type, setType] = useState<"list"|"map">("list");
  const [coll, setColl] = useState<"signals"|"ideas"|"events">("signals");
  const [limit, setLimit] = useState(5);
  const [settlementId, setSettlementId] = useState("");

  const base = typeof window !== "undefined" ? location.origin : "";
  const src =
    type==="map"
      ? `${base}/embed/map?limit=${limit}`
      : `${base}/embed/list?coll=${coll}&limit=${limit}${settlementId?`&settlementId=${encodeURIComponent(settlementId)}`:""}` ;

  const code = `<iframe src="${src}" width="100%" height="${type==="map"?"440":"600"}" style="border:0;overflow:hidden" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` ;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Embed Playground</h1>
      <div className="grid gap-2 md:grid-cols-4">
        <select value={type} onChange={e=>setType(e.target.value as any)} className="rounded border px-2 py-1">
          <option value="list">Списък</option>
          <option value="map">Карта</option>
        </select>
        {type==="list" && (
          <>
            <select value={coll} onChange={e=>setColl(e.target.value as any)} className="rounded border px-2 py-1">
              <option value="signals">Signals</option>
              <option value="ideas">Ideas</option>
              <option value="events">Events</option>
            </select>
            <input placeholder="settlementId (по избор)" value={settlementId} onChange={e=>setSettlementId(e.target.value)} className="rounded border px-2 py-1" />
          </>
        )}
        <input type="number" min={1} max={100} value={limit} onChange={e=>setLimit(Number(e.target.value))} className="rounded border px-2 py-1" />
      </div>

      <div className="rounded border p-3">
        <div className="text-sm font-medium mb-1">Преглед</div>
        <iframe src={src} width="100%" height={type==="map"?440:600} style={{ border:0, overflow:"hidden" }} loading="lazy" />
      </div>

      <div className="rounded border p-3">
        <div className="text-sm font-medium mb-1">Код за поставяне</div>
        <pre className="text-xs bg-neutral-50 p-2 rounded overflow-auto">{code}</pre>
      </div>

      <div className="text-xs text-neutral-500">
        JSON API: <code>/api/public/list?coll=signals&limit=20</code> · ICS: <code>/api/public/events.ics</code>
      </div>
    </div>
  );
}

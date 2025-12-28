"use client";
import { useEffect, useMemo, useState } from "react";
import SettlementAutocomplete from "@/components/settlements/SettlementAutocomplete";

type Coll = "signals"|"ideas"|"events";
type Sort = { key: string; dir: "asc"|"desc" };

export default function DataTable({ initialColl="signals" }: { initialColl?: Coll }) {
  const [coll, setColl] = useState<Coll>(initialColl);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [settlementId, setSettlementId] = useState<string| null>(null);
  const [from, setFrom] = useState<string>(""); // yyyy-mm-dd
  const [to, setTo] = useState<string>("");
  const [sort, setSort] = useState<Sort>({ key: coll==="events"?"when":"createdAt", dir: "desc" });
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [busy, setBusy] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [coll, status, settlementId, sort, page]);
  useEffect(()=>{ const t = setTimeout(()=>{ setPage(0); load(); }, 400); return ()=>clearTimeout(t); /* eslint-disable-next-line */ }, [q, from, to]);

  async function load() {
    setBusy(true);
    const params = new URLSearchParams({
      coll, q, limit: String(pageSize), start: String(page*pageSize),
      sort: sort.key, dir: sort.dir
    });
    if (status) params.set("status", status);
    if (settlementId) params.set("settlementId", settlementId);
    if (from) params.set("from", String(new Date(from).getTime()));
    if (to) params.set("to", String(new Date(to).getTime()+24*3600*1000-1));
    const res = await fetch(`/api/admin/list?${params.toString()}` );
    const data = await res.json();
    setRows(data.rows || []);
    setTotal(data.total || 0);
    setBusy(false);
    setSelection(new Set());
  }

  function toggleSort(key: string) {
    setSort(s => s.key===key ? { key, dir: s.dir==="asc"?"desc":"asc" } : { key, dir: "asc" });
  }

  async function inlineSave(id: string, patch: any) {
    const res = await fetch("/api/admin/update", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ coll, id, patch })});
    if (!res.ok) { alert("Грешка при запис"); return; }
    setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  function onCellEdit(e: React.FocusEvent<HTMLElement>, r: any, key: string) {
    const val = (e.target as HTMLElement).innerText.trim();
    if (val === String(r[key] ?? "")) return;
    const patch: any = {}; patch[key] = key==="when" ? Date.parse(val) || r[key] : val;
    inlineSave(r.id, patch);
  }

  function toggleSel(id: string) {
    setSelection(prev => {
      const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
  }

  async function bulkStatus(newStatus: string) {
    if (selection.size === 0) return;
    const res = await fetch("/api/admin/signals/bulk-status", { // от Ген.26 с guard/scope
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ ids: Array.from(selection), status: newStatus })
    });
    if (!res.ok) { alert("Bulk грешка"); return; }
    await load();
  }

  const isSignals = coll === "signals";
  const isIdeas = coll === "ideas";
  const isEvents = coll === "events";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-2">
        <select value={coll} onChange={(e)=>{ setColl(e.target.value as Coll); setSort({ key: e.target.value==="events"?"when":"createdAt", dir:"desc"}); setPage(0); }} className="rounded border px-2 py-1">
          <option value="signals">Signals</option>
          <option value="ideas">Ideas</option>
          <option value="events">Events</option>
        </select>

        <input placeholder="Търсене…" className="rounded border px-2 py-1 w-64" value={q} onChange={(e)=>setQ(e.target.value)} />

        {(isSignals || isIdeas) && (
          <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(0); }} className="rounded border px-2 py-1">
            <option value="">Всички статуси</option>
            {isSignals && <>
              <option value="new">new</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
              <option value="rejected">rejected</option>
              <option value="overdue">overdue</option>
            </>}
            {isIdeas && <>
              <option value="new">new</option>
              <option value="considering">considering</option>
              <option value="planned">planned</option>
              <option value="done">done</option>
              <option value="rejected">rejected</option>
            </>}
          </select>
        )}

        <div className="w-64">
          <SettlementAutocomplete value={settlementId || undefined} onChange={(id)=>setSettlementId(id)} placeholder="Филтър по селище…" />
        </div>

        <div className="flex items-center gap-1">
          <label className="text-xs text-neutral-600">От</label>
          <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded border px-2 py-1" />
          <label className="text-xs text-neutral-600">До</label>
          <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded border px-2 py-1" />
        </div>

        <a
          className="ml-auto rounded border px-3 py-1 text-sm"
          href={`/api/admin/export?collection=${coll}&format=csv&limit=5000${status?`&status=${status}`:""}` }
        >
          Експорт CSV
        </a>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-2 w-8"></th>
              <Th name="createdAt" label="Създадено" sort={sort} onSort={toggleSort} />
              <Th name="title" label="Заглавие" sort={sort} onSort={toggleSort} />
              {isSignals && <Th name="status" label="Статус" sort={sort} onSort={toggleSort} />}
              {isSignals && <Th name="type" label="Тип" sort={sort} onSort={toggleSort} />}
              {isEvents && <Th name="when" label="Кога" sort={sort} onSort={toggleSort} />}
              <Th name="settlementLabel" label="Селище" sort={sort} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-2">
                  <input type="checkbox" checked={selection.has(r.id)} onChange={()=>toggleSel(r.id)} />
                </td>
                <td className="p-2 text-xs text-neutral-500">{new Date((r.createdAt||r.when||0)).toLocaleString()}</td>

                <td className="p-2">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e)=>onCellEdit(e, r, "title")}
                    className="min-w-[240px] rounded outline-none focus:ring-2 focus:ring-black/20 px-1"
                  >
                    {r.title || ""}
                  </div>
                  <div className="text-xs text-neutral-500 line-clamp-2">{r.desc || ""}</div>
                </td>

                {isSignals && (
                  <td className="p-2">
                    <select defaultValue={r.status||"new"} onChange={(e)=>inlineSave(r.id, { status: e.target.value })} className="rounded border px-2 py-1">
                      <option value="new">new</option><option value="in_progress">in_progress</option>
                      <option value="resolved">resolved</option><option value="rejected">rejected</option>
                      <option value="overdue">overdue</option>
                    </select>
                  </td>
                )}

                {isSignals && (
                  <td className="p-2">
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e)=>onCellEdit(e, r, "type")}
                      className="min-w-[120px] rounded outline-none focus:ring-2 focus:ring-black/20 px-1"
                    >
                      {r.type || ""}
                    </div>
                  </td>
                )}

                {isEvents && (
                  <td className="p-2">
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e)=>onCellEdit(e, r, "when")}
                      title="Въведи дата, напр. 2025-09-01 18:30"
                      className="min-w-[160px] rounded outline-none focus:ring-2 focus:ring-black/20 px-1"
                    >
                      {r.when ? new Date(r.when).toLocaleString() : ""}
                    </div>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e)=>onCellEdit(e, r, "where")}
                      className="text-xs text-neutral-600 rounded outline-none focus:ring-2 focus:ring-black/20 px-1"
                    >
                      {r.where || ""}
                    </div>
                  </td>
                )}

                <td className="p-2">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e)=>onCellEdit(e, r, "settlementLabel")}
                    className="min-w-[160px] rounded outline-none focus:ring-2 focus:ring-black/20 px-1"
                  >
                    {r.settlementLabel || ""}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-4 text-center text-sm text-neutral-600" colSpan={7}>Няма записи.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk действия и пагинация */}
      <div className="flex flex-wrap items-center gap-2">
        {isSignals && (
          <>
            <span className="text-sm">Bulk статус:</span>
            {["new","in_progress","resolved","rejected","overdue"].map(s=>(
              <button key={s} onClick={()=>bulkStatus(s)} disabled={selection.size===0}
                className="rounded border px-2 py-1 text-xs">{s}</button>
            ))}
          </>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span>{page*pageSize+1}-{Math.min((page+1)*pageSize, total)} от {total}</span>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} className="rounded border px-2 py-1">Назад</button>
          <button onClick={()=>setPage(p=>((p+1)*pageSize<total)?p+1:p)} disabled={(page+1)*pageSize>=total} className="rounded border px-2 py-1">Напред</button>
        </div>
      </div>
      {busy && <div className="text-xs text-neutral-500">Зареждане…</div>}
    </div>
  );
}

function Th({ name, label, sort, onSort }: { name:string; label:string; sort:{key:string;dir:"asc"|"desc"}; onSort:(k:string)=>void }) {
  const active = sort.key === name;
  return (
    <th className="p-2 text-left">
      <button onClick={()=>onSort(name)} className="flex items-center gap-1">
        <span>{label}</span>
        {active && <span className="text-xs">{sort.dir==="asc"?"▲":"▼"}</span>}
      </button>
    </th>
  );
}

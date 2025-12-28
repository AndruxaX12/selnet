"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSearchEngine } from "@/lib/search/useSearchEngine";
import { highlight } from "@/lib/search/highlight";
import { format } from "date-fns";

type TypeOpt = "all"|"signals"|"ideas"|"events";

const inputClass = "w-full rounded-lg border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const selectClass = "w-full rounded-lg border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function SearchPage() {
  const sp = useSearchParams(); 
  const router = useRouter(); 
  const pathname = usePathname();
  
  const [q, setQ] = useState(sp.get("q") || "");
  const [type, setType] = useState<TypeOpt>((sp.get("type") as TypeOpt) || "all");
  const [settlement, setSettlement] = useState(sp.get("s") || "");
  const [from, setFrom] = useState(sp.get("from") || "");
  const [to, setTo] = useState(sp.get("to") || "");
  
  const { loading, rebuilding, count, rebuild, run } = useSearchEngine();

  const fromTs = useMemo(() => from ? Date.parse(from) : undefined, [from]);
  const toTs = useMemo(() => to ? Date.parse(to) : undefined, [to]);

  const results = useMemo(() => run({ q, type, settlement, from: fromTs, to: toTs }), [q, type, settlement, fromTs, toTs, run]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type !== "all") params.set("type", type);
    if (settlement) params.set("s", settlement);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const url = params.toString() ? `${pathname}?${params}` : pathname!;
    router.replace(url);
  }, [q, type, settlement, from, to]); // eslint-disable-line

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Търсене</h1>

      {/* Контроли */}
      <div className="grid md:grid-cols-6 gap-2">
        <input 
          placeholder="Търси по заглавие/описание…" 
          className={inputClass} 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
        <select 
          className={selectClass} 
          value={type} 
          onChange={e => setType(e.target.value as TypeOpt)}
        >
          <option value="all">Всички</option>
          <option value="signals">Сигнали</option>
          <option value="ideas">Идеи</option>
          <option value="events">Събития</option>
        </select>
        <input 
          placeholder="Селище / settlementId" 
          className={inputClass} 
          value={settlement} 
          onChange={e => setSettlement(e.target.value)} 
        />
        <input 
          type="date" 
          className={inputClass} 
          value={from} 
          onChange={e => setFrom(e.target.value)} 
        />
        <input 
          type="date" 
          className={inputClass} 
          value={to} 
          onChange={e => setTo(e.target.value)} 
        />
        <button 
          onClick={rebuild} 
          disabled={rebuilding} 
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {rebuilding ? "Обновяване…" : "Обнови индекс"}
        </button>
      </div>

      {/* Статуси */}
      <div className="text-xs text-neutral-500">
        {loading ? "Индексът се зарежда…" : `Индексирани документи: ${count}. Резултати: ${results.length}.`}
      </div>

      {/* Резултати */}
      <ul className="divide-y rounded border bg-white">
        {results.map(r => (
          <li key={`${r.type}:${r.id}`} className="p-3 hover:bg-neutral-50">
            <div className="text-xs text-neutral-500 uppercase">{r.type}</div>
            <a 
              href={r.url} 
              className="font-medium underline text-blue-600 hover:text-blue-800" 
              dangerouslySetInnerHTML={{ __html: highlight(r.title, q) }} 
            />
            {r.settlementLabel && (
              <div className="text-xs text-neutral-500">{r.settlementLabel}</div>
            )}
            {r.desc && (
              <div 
                className="text-sm mt-1 text-gray-600" 
                dangerouslySetInnerHTML={{ __html: highlight((r.desc || "").slice(0, 240), q) }} 
              />
            )}
            <div className="text-xs text-neutral-500 mt-1">
              {(r.when || r.createdAt) ? format(new Date(r.when || r.createdAt!), "yyyy-MM-dd HH:mm") : ""}
            </div>
          </li>
        ))}
        {!loading && results.length === 0 && (
          <li className="p-4 text-sm text-neutral-600">
            Няма съвпадения. Опитайте с друга ключова дума или свалете филтрите.
          </li>
        )}
      </ul>
    </div>
  );
}

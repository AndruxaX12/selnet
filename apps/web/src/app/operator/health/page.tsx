"use client";
import { useEffect, useState } from "react";
import { canModerate } from "@/lib/roles";
import { useUserDoc } from "@/lib/useUserDoc";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Daily = { day: string; name: string; p75: number; p95: number; count: number };

export default function HealthPage() {
  const { data: me } = useUserDoc<any>();
  const [daily, setDaily] = useState<Daily[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/health");
      const j = await res.json();
      setDaily(j.daily || []);
      setErrors(j.errors || []);
    } catch (error) {
      console.error("Failed to load health data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!canModerate(me?.role)) return <div>Нямаш права.</div>;

  const lcp = daily.filter(d=>d.name==="LCP");
  const inp = daily.filter(d=>d.name==="INP");
  const cls = daily.filter(d=>d.name==="CLS");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Health</h1>

      {/* Карти със SLO */}
      <div className="grid md:grid-cols-3 gap-3">
        <SloCard title="LCP p75" value={fmt(lcp.at(-1)?.p75)} goal="≤ 2.5s" good={(lcp.at(-1)?.p75||0) <= 2500} />
        <SloCard title="INP p75" value={fmt(inp.at(-1)?.p75)} goal="≤ 200ms" good={(inp.at(-1)?.p75||0) <= 200} />
        <SloCard title="CLS p75" value={(cls.at(-1)?.p75||0).toFixed(3)} goal="≤ 0.1" good={(cls.at(-1)?.p75||0) <= 0.1} />
      </div>

      {/* Графики */}
      <section className="rounded border p-3">
        <h2 className="font-medium mb-2">LCP p75 (ms)</h2>
        <Chart data={lcp} />
      </section>
      <section className="rounded border p-3">
        <h2 className="font-medium mb-2">INP p75 (ms)</h2>
        <Chart data={inp} />
      </section>

      {/* Последни грешки */}
      <section className="rounded border p-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Последни грешки (клиент)</h2>
          <button onClick={load} className="rounded border px-3 py-1 text-sm hover:bg-gray-50 transition-colors">Обнови</button>
        </div>
        <ul className="divide-y">
          {errors.map((e:any)=>(
            <li key={e.id} className="py-2">
              <div className="text-xs text-neutral-500">{new Date(e.at).toLocaleString()} · {e.type}</div>
              <div className="text-sm font-medium">{e.msg}</div>
              {e.url && <div className="text-xs text-neutral-500">{e.url}</div>}
              {e.stack && <pre className="text-xs bg-neutral-50 p-2 rounded mt-1 overflow-x-auto">{String(e.stack).slice(0,600)}</pre>}
            </li>
          ))}
          {errors.length===0 && <li className="py-2 text-sm text-neutral-600">Няма грешки последните 24ч.</li>}
        </ul>
      </section>

      {loading && <div className="text-sm text-neutral-500">Зареждане…</div>}
    </div>
  );
}

function fmt(v?: number){ return v ? Math.round(v).toString() : "—"; }

function SloCard({ title, value, goal, good }: { title:string; value:string; goal:string; good:boolean }) {
  return (
    <div className={`rounded border p-3 ${good ? "border-green-600" : "border-amber-600"}` }>
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500">Цел: {goal}</div>
    </div>
  );
}

function Chart({ data }: { data: Daily[] }) {
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="p75" stroke="#3b82f6" />
          <Line type="monotone" dataKey="p95" stroke="#ef4444" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

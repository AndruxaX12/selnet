"use client";

import { useEffect, useMemo, useState } from "react";
import { Map as MapIcon, Layers, Flame } from "lucide-react";
import AppMap from "@/components/map/AppMap";
import { MapPoint, BBox } from "@/types/map";
import { usePathname } from "next/navigation";

export default function OperatorMapPage() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;
  const [rows, setRows] = useState<any[]>([]);
  const [bbox, setBbox] = useState<BBox | undefined>([42.874, 23.7646, 42.934, 23.8246]);
  const [mode, setMode] = useState<"markers" | "heatmap">("markers");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    // Fetch categories
    fetch("/api/admin/categories").then(r => r.json()).then(data => {
        if(Array.isArray(data)) setCategories(data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const statuses = ["new","triaged","in_progress","resolved","rejected","archived"];
    Promise.all(
      statuses.map(s => fetch(`/api/admin/mod/list?coll=signals&status=${s}&limit=500`).then(r => r.json().catch(()=>({ rows: [] }))))
    )
    .then(results => {
      if (cancelled) return;
      const combined = results.flatMap(r => Array.isArray(r.rows) ? r.rows : []);
      setRows(combined);
    })
    .catch(() => {
      if (cancelled) return;
      setRows([]);
    });
    return () => { cancelled = true; };
  }, []);

  const points = useMemo<MapPoint[]>(() => {
    if (!rows.length) return [];
    
    // Apply filters
    const filtered = rows.filter(row => {
        if (statusFilter !== "all" && row.status !== statusFilter) return false;
        if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
        return true;
    });

    const out: MapPoint[] = [];
    for (const row of filtered) {
      const geo = (row.geo ?? row.location ?? null) as { lat?: number; lng?: number } | null;
      const lat = typeof geo?.lat === "number" ? geo.lat : undefined;
      const lng = typeof geo?.lng === "number" ? geo.lng : undefined;
      if (lat === undefined || lng === undefined) continue;
      out.push({
        id: row.id,
        lat,
        lng,
        title: row.title || "",
        url: `${base}/signals/${row.id}`,
        type: "signal"
      });
    }
    return out;
  }, [rows, base, statusFilter, categoryFilter]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapIcon className="h-6 w-6" />
            Карта
          </h1>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
                <option value="all">Всички статуси</option>
                <option value="new">Нов</option>
                <option value="triaged">Разпределен</option>
                <option value="in_progress">В работа</option>
                <option value="resolved">Решен</option>
                <option value="rejected">Отхвърлен</option>
            </select>

            {/* Category Filter */}
            <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
                <option value="all">Всички категории</option>
                {categories.map(c => (
                    <option key={c.id} value={c.label}>{c.label}</option>
                ))}
            </select>

            <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode("markers")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === "markers"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Layers className="h-4 w-4" />
              Сигнали
            </button>
            <button
              onClick={() => setMode("heatmap")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === "heatmap"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Flame className="h-4 w-4" />
              Горещи точки
            </button>
          </div>
        </div>
      </div>
      </div>
      <div className="flex-1">
        <AppMap
          points={points}
          bbox={bbox}
          zoom={12}
          onViewport={(b) => setBbox(b)}
          visualizationMode={mode}
        />
      </div>
    </div>
  );
}

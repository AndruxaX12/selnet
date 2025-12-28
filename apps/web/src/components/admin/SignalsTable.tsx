"use client";

import { useEffect, useState } from "react";
import { Signal, SignalStatus } from "@/types/operator";
import { STATUS_LABELS } from "@/lib/operator/constants";
import { AdminSignalRow } from "@/components/admin/AdminSignalRow";
import { Loader2, Search, Filter, RefreshCw } from "lucide-react";
import SettlementAutocomplete from "@/components/settlements/SettlementAutocomplete";

export default function SignalsTable() {
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  
  // Filters
  const [status, setStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [settlementId, setSettlementId] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchSignals();
  }, [page, status, settlementId]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      fetchSignals();
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        coll: "signals",
        limit: String(pageSize),
        start: String(page * pageSize),
        sort: "createdAt",
        dir: "desc"
      });

      if (status !== "all") {
        params.set("status", status);
      }
      if (searchQuery) {
        params.set("q", searchQuery);
      }
      if (settlementId) {
        params.set("settlementId", settlementId);
      }

      const res = await fetch(`/api/admin/list?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSignals(data.rows || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch signals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAction = () => {
    // Refresh list after action
    fetchSignals();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Filters Header */}
      <div className="p-4 border-b border-gray-100 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => { setStatus("all"); setPage(0); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                status === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Всички
            </button>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setStatus(key); setPage(0); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  status === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Търсене по заглавие, описание..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Region Filter */}
          <div className="w-64">
            <SettlementAutocomplete
              value={settlementId}
              onChange={setSettlementId}
              placeholder="Филтър по населено място"
            />
          </div>

          <button 
            onClick={fetchSignals}
            className="p-2 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-gray-50"
            title="Обнови"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {signals.length > 0 ? (
            signals.map((signal) => (
              <div key={signal.id} className="p-4 hover:bg-gray-50 transition-colors">
                <AdminSignalRow
                  data={signal}
                  selected={selectedIds.includes(signal.id)}
                  onSelect={() => handleSelect(signal.id)}
                  onAction={handleAction}
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Filter className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Няма намерени сигнали</p>
              <p className="text-sm">Опитайте да промените филтрите</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Показани {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} от {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Предишна
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * pageSize >= total}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Следваща
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

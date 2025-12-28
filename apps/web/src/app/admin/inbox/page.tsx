"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Signal, SignalFilters, SignalsListResponse } from "@/types/operator";
import { INBOX_TABS } from "@/lib/operator/constants";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { SignalRow } from "@/components/operator/inbox/SignalRow";
import { FiltersSidebar } from "@/components/operator/inbox/FiltersSidebar";
import { BulkActionBar } from "@/components/operator/inbox/BulkActionBar";
import { SortDropdown } from "@/components/operator/inbox/SortDropdown";
import { Loader2, Search } from "lucide-react";

export default function OperatorInboxPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "novo");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SignalFilters>({});

  const fetchSignals = useCallback(
    async (append = false) => {
      setLoading(true);
      try {
        const headers = await getIdTokenHeader();
        
        const params = new URLSearchParams({
          tab: activeTab,
          ...(searchQuery && { q: searchQuery }),
          ...(filters.sort && { sort: filters.sort }),
          ...(cursor && append && { cursor }),
          ...Object.fromEntries(
            Object.entries(filters).filter(([k, v]) => v !== undefined && k !== "sort")
          )
        });

        const res = await fetch(`/api/operator/signals?${params}`, { headers });
        
        if (res.ok) {
          const data: SignalsListResponse = await res.json();
          setSignals((prev) => {
            const merged = append ? [...prev, ...data.items] : data.items;
            return merged.filter((s) => s.status !== "popraven" && s.status !== "otkhvurlen");
          });
          setCursor(data.next_cursor || null);
        }
      } catch (error) {
        console.error("Failed to fetch signals:", error);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, searchQuery, filters, cursor]
  );

  useEffect(() => {
    fetchSignals();
  }, [activeTab, searchQuery, filters.sort]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedIds([]);
    setCursor(null);
    router.push(`${base}/admin/inbox?tab=${tabId}`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(signals.map((s) => s.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  return (
    <div className="flex h-full">
      {/* Filters Sidebar */}
      <FiltersSidebar
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setCursor(null);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Опашки</h1>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 mb-4">
            {INBOX_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Търси по заглавие, адрес..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <SortDropdown
              value={filters.sort || "sla_urgent"}
              onChange={(sort) => setFilters((prev) => ({ ...prev, sort }))}
            />
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <BulkActionBar
            count={selectedIds.length}
            onClear={clearSelection}
            onAction={async (action) => {
              // Handle bulk action
              console.log("Bulk action:", action, selectedIds);
              clearSelection();
              await fetchSignals();
            }}
          />
        )}

        {/* Signals List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && signals.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-500">Няма сигнали в тази опашка</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
                <SignalRow
                  key={signal.id}
                  data={signal}
                  selected={selectedIds.includes(signal.id)}
                  onSelect={() => toggleSelect(signal.id)}
                  onAction={async () => {
                    await fetchSignals();
                  }}
                  hrefBase="admin"
                />
              ))}

              {/* Load More */}
              {cursor && (
                <div className="flex justify-center py-6">
                  <button
                    onClick={() => fetchSignals(true)}
                    disabled={loading}
                    className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-700"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Зареди още"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

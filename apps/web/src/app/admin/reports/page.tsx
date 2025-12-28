"use client";

import { useState, useEffect } from "react";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { SLAReportTable } from "@/components/operator/reports/SLAReportTable";
import { VolumeReport } from "@/components/operator/reports/VolumeReport";
import { TrendChart } from "@/components/operator/reports/TrendChart";
import { ExportButtons } from "@/components/operator/reports/ExportButtons";
import { Calendar, Download, Loader2 } from "lucide-react";

interface ReportData {
  sla: {
    tta_within_48h: number;
    tta_within_48h_pct: number;
    tta_overdue: number;
    process_within_5d: number;
    process_within_5d_pct: number;
    ttr_median_days: number;
    ttr_over_14d: number;
  };
  volumes: {
    by_category: Array<{ id: string; name: string; count: number }>;
    by_area: Array<{ id: string; name: string; count: number }>;
    by_status: Array<{ status: string; count: number }>;
  };
  trends: Array<{
    date: string;
    new: number;
    confirmed: number;
    in_process: number;
    resolved: number;
  }>;
}

export default function OperatorReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo, groupBy]);

  async function fetchReports() {
    setLoading(true);
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch(
        `/api/operator/reports?from=${dateFrom}&to=${dateTo}&group=${groupBy}`,
        { headers }
      );

      if (res.ok) {
        const reportData = await res.json();
        setData(reportData);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Отчети</h1>
        <p className="text-gray-600">SLA изпълнение, обеми и тенденции</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              От дата
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              До дата
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Групиране
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="day">По дни</option>
              <option value="week">По седмици</option>
              <option value="month">По месеци</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Calendar className="h-5 w-5" />
              )}
              Генерирай
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* SLA Report */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                SLA Изпълнение
              </h2>
              <ExportButtons
                data={data.sla}
                filename="sla-report"
                type="sla"
              />
            </div>
            <SLAReportTable data={data.sla} />
          </div>

          {/* Trend Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Тенденции
              </h2>
              <ExportButtons
                data={data.trends}
                filename="trends-report"
                type="trends"
              />
            </div>
            <TrendChart data={data.trends} />
          </div>

          {/* Volume Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  По категория
                </h2>
                <ExportButtons
                  data={data.volumes.by_category}
                  filename="volume-by-category"
                  type="volumes"
                />
              </div>
              <VolumeReport data={data.volumes.by_category} />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  По район
                </h2>
                <ExportButtons
                  data={data.volumes.by_area}
                  filename="volume-by-area"
                  type="volumes"
                />
              </div>
              <VolumeReport data={data.volumes.by_area} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-gray-500">Няма данни за показване</p>
        </div>
      )}
    </div>
  );
}

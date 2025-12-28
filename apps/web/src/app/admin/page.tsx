"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/types/operator";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Loader2, TrendingUp, Clock, AlertCircle, CheckCircle2, BarChart3 } from "lucide-react";

export default function OperatorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "7days" | "30days">("today");

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        const headers = await getIdTokenHeader();
        const res = await fetch(`/api/operator/dashboard?period=${period}`, {
          headers
        });

        if (res.ok) {
          const data = await res.json();
          setData(data);
        } else {
          console.error("Dashboard API error:", res.status);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboard();
  }, [period]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Табло</h1>
          <p className="text-gray-600 mt-2">Преглед на ключови показатели и активност</p>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-2">
          {[
            { value: "today", label: "Днес" },
            { value: "7days", label: "7 дни" },
            { value: "30days", label: "30 дни" }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value as typeof period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === option.value
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <KPICard
              title="Нови сигнали"
              value={period === "today" ? data.kpi.new_today : period === "7days" ? data.kpi.new_7days : data.kpi.new_30days}
              icon={<TrendingUp className="h-5 w-5" />}
              color="blue"
            />
            <KPICard
              title="Потвърдени ≤48ч"
              value={`${data.kpi.confirmed_within_48h_pct}%`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              color="green"
              target={95}
              current={data.kpi.confirmed_within_48h_pct}
            />
            <KPICard
              title="Просрочени TTA"
              value={data.kpi.tta_overdue}
              icon={<AlertCircle className="h-5 w-5" />}
              color="red"
            />
            <KPICard
              title="В процес"
              value={data.kpi.in_process}
              icon={<Clock className="h-5 w-5" />}
              color="purple"
            />
            <KPICard
              title="Поправени"
              value={data.kpi.resolved_period}
              icon={<CheckCircle2 className="h-5 w-5" />}
              color="green"
            />
            <KPICard
              title="Медиана TTR"
              value={`${data.kpi.ttr_median_days} дни`}
              icon={<BarChart3 className="h-5 w-5" />}
              color="blue"
              target={14}
              current={data.kpi.ttr_median_days}
            />
          </div>

          {/* Placeholder for charts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Графики (Coming Soon)</h3>
            <p className="text-gray-500">Вход срещу обработени, топ категории, heatmap</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-gray-500">Няма данни</p>
        </div>
      )}
    </div>
  );
}

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "purple";
  target?: number;
  current?: number;
}

function KPICard({ title, value, icon, color, target, current }: KPICardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const meetsSLA = target && current ? current >= target : undefined;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {meetsSLA !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            meetsSLA ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {meetsSLA ? "✓ SLA" : "✗ SLA"}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {target && (
        <p className="text-xs text-gray-500 mt-1">Цел: {target}{typeof value === 'string' && value.includes('%') ? '%' : ''}</p>
      )}
    </div>
  );
}

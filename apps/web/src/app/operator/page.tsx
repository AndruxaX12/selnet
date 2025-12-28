"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Users, Flag, Calendar, AlertCircle } from "lucide-react";
import { getIdTokenHeader } from "@/lib/get-id-token";

interface DashboardStats {
  users: { total: number; change: number };
  signals: { total: number; change: number };
  ideas: { total: number; change: number };
  events: { total: number; change: number };
  pendingApprovals: { count: number; items: any[] };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const headers = await getIdTokenHeader();
        const res = await fetch("/api/admin/dashboard", {
          headers,
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Dashboard API error:", errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        
        const data = await res.json();
        setStats(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch dashboard stats:", err);
        setError(err.message || "Грешка при зареждане на статистики");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Зареждане на статистики...</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-24 animate-pulse rounded-lg bg-gray-200"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Преглед на системата</p>
        </div>
        <Card className="p-8">
          <div className="flex items-center gap-4 text-red-600">
            <AlertCircle className="h-8 w-8" />
            <div>
              <h3 className="font-semibold">Грешка при зареждане</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Потребители",
      value: stats?.users.total || 0,
      change: stats?.users.change || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Сигнали",
      value: stats?.signals.total || 0,
      change: stats?.signals.change || 0,
      icon: Flag,
      color: "from-red-500 to-red-600",
    },
    {
      title: "Идеи",
      value: stats?.ideas.total || 0,
      change: stats?.ideas.change || 0,
      icon: Calendar,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Събития",
      value: stats?.events.total || 0,
      change: stats?.events.change || 0,
      icon: Calendar,
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Табло</h1>
        <p className="text-gray-600 mt-1">Преглед на системата и ключови метрики</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change > 0;
          const isNegative = stat.change < 0;
          const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

          return (
            <Card 
              key={stat.title} 
              className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 transition-all">
                    {stat.value.toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <TrendIcon
                      className={`h-4 w-4 transition-colors ${
                        isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium transition-colors ${
                        isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-500"
                      }`}
                    >
                      {stat.change > 0 ? "+" : ""}
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">тази седмица</span>
                  </div>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-md transition-transform hover:scale-110`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pending Approvals */}
      {stats?.pendingApprovals && stats.pendingApprovals.count > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Чакащи одобрения</h2>
                <p className="text-sm text-gray-600">
                  {stats.pendingApprovals.count} {stats.pendingApprovals.count === 1 ? "запис" : "записа"} чака одобрение
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y">
            {stats.pendingApprovals.items.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.title || "Без заглавие"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                        {item.type === "signal" && "🚩 Сигнал"}
                        {item.type === "idea" && "💡 Идея"}
                        {item.type === "event" && "📅 Събитие"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("bg-BG")}
                      </span>
                    </div>
                  </div>
                  <a
                    href={"/operator/mod"}
                    className="flex-shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Преглед
                  </a>
                </div>
              </div>
            ))}
          </div>
          {stats.pendingApprovals.count > 5 && (
            <div className="border-t bg-gray-50 p-4 text-center">
              <a
                href={"/operator/mod"}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
              >
                Виж всички ({stats.pendingApprovals.count}) →
              </a>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

import { DashboardData } from "@/types/operator";
import { KPIStatCard } from "./KPIStatCard";
import { DualLineChart } from "./DualLineChart";
import { CategoryTrendList } from "./CategoryTrendList";
import { RecentEscalations } from "./RecentEscalations";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Settings2,
  CheckCircle,
  Timer
} from "lucide-react";

interface Props {
  data: DashboardData;
  period: "today" | "7days" | "30days";
}

export function KPIDashboard({ data, period }: Props) {
  const { kpi, inflow_vs_processed, top_categories, recent_escalations } = data;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <KPIStatCard
          title="Нови сигнали"
          value={
            period === "today"
              ? kpi.new_today
              : period === "7days"
              ? kpi.new_7days
              : kpi.new_30days
          }
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
          subtitle={`за период: ${
            period === "today" ? "днес" : period === "7days" ? "7 дни" : "30 дни"
          }`}
        />

        <KPIStatCard
          title="Потвърдени ≤48ч"
          value={kpi.confirmed_within_48h}
          subtitle={`${kpi.confirmed_within_48h_pct.toFixed(1)}% от всички`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
          badge={kpi.confirmed_within_48h_pct >= 90 ? "OK" : "Внимание"}
          badgeColor={kpi.confirmed_within_48h_pct >= 90 ? "green" : "amber"}
        />

        <KPIStatCard
          title="Просрочени TTA"
          value={kpi.tta_overdue}
          subtitle={
            kpi.tta_overdue_trend > 0
              ? `↑ ${kpi.tta_overdue_trend} повече`
              : kpi.tta_overdue_trend < 0
              ? `↓ ${Math.abs(kpi.tta_overdue_trend)} по-малко`
              : "без промяна"
          }
          icon={<AlertTriangle className="h-6 w-6" />}
          color={kpi.tta_overdue > 0 ? "red" : "gray"}
          trend={kpi.tta_overdue_trend}
        />

        <KPIStatCard
          title="В процес"
          value={kpi.in_process}
          subtitle="активни"
          icon={<Settings2 className="h-6 w-6" />}
          color="purple"
        />

        <KPIStatCard
          title="Поправени"
          value={kpi.resolved_period}
          subtitle={`за ${period === "today" ? "днес" : period === "7days" ? "7 дни" : "30 дни"}`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />

        <KPIStatCard
          title="Медиана TTR"
          value={`${kpi.ttr_median_days} дни`}
          subtitle={kpi.ttr_median_days <= 14 ? "В норма" : "Над норма"}
          icon={<Timer className="h-6 w-6" />}
          color={kpi.ttr_median_days <= 14 ? "green" : "amber"}
          badge={`Цел: ≤14 дни`}
        />
      </div>

      {/* Dual Line Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Вход срещу обработени
        </h2>
        <DualLineChart data={inflow_vs_processed} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Топ категории
          </h2>
          <CategoryTrendList categories={top_categories} />
        </div>

        {/* Recent Escalations */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Последни ескалации
          </h2>
          <RecentEscalations escalations={recent_escalations} />
        </div>
      </div>
    </div>
  );
}

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: "blue" | "green" | "red" | "amber" | "purple" | "gray";
  badge?: string;
  badgeColor?: "green" | "amber" | "red";
  trend?: number;
}

export function KPIStatCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  badge,
  badgeColor = "green",
  trend
}: Props) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
    gray: "bg-gray-100 text-gray-600"
  };

  const badgeColorClasses = {
    green: "bg-green-100 text-green-700 border-green-300",
    amber: "bg-amber-100 text-amber-700 border-amber-300",
    red: "bg-red-100 text-red-700 border-red-300"
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        {badge && (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded border ${badgeColorClasses[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>

      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend !== undefined && trend !== 0 && (
          <span
            className={`flex items-center text-sm font-medium ${
              trend > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(trend)}
          </span>
        )}
      </div>

      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

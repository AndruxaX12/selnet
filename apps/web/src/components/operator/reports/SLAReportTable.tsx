import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface SLAData {
  tta_within_48h: number;
  tta_within_48h_pct: number;
  tta_overdue: number;
  process_within_5d: number;
  process_within_5d_pct: number;
  ttr_median_days: number;
  ttr_over_14d: number;
}

interface Props {
  data: SLAData;
}

export function SLAReportTable({ data }: Props) {
  const ttaTarget = 90; // 90% target
  const processTarget = 85; // 85% target
  const ttrTarget = 14; // 14 days target

  const ttaStatus = data.tta_within_48h_pct >= ttaTarget ? "success" : "warning";
  const processStatus = data.process_within_5d_pct >= processTarget ? "success" : "warning";
  const ttrStatus = data.ttr_median_days <= ttrTarget ? "success" : "warning";

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Метрика
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
              Стойност
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
              Цел
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
              Статус
            </th>
          </tr>
        </thead>
        <tbody>
          {/* TTA Row */}
          <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-4 px-4">
              <div>
                <p className="font-medium text-gray-900">TTA ≤48ч</p>
                <p className="text-sm text-gray-500">Time To Acknowledge</p>
              </div>
            </td>
            <td className="text-center py-4 px-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.tta_within_48h_pct.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  {data.tta_within_48h} от {data.tta_within_48h + data.tta_overdue}
                </p>
              </div>
            </td>
            <td className="text-center py-4 px-4">
              <p className="text-lg font-semibold text-gray-700">≥{ttaTarget}%</p>
            </td>
            <td className="text-center py-4 px-4">
              <StatusBadge status={ttaStatus} />
            </td>
          </tr>

          {/* Process Row */}
          <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-4 px-4">
              <div>
                <p className="font-medium text-gray-900">В процес ≤5 дни</p>
                <p className="text-sm text-gray-500">От потвърждение</p>
              </div>
            </td>
            <td className="text-center py-4 px-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.process_within_5d_pct.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">{data.process_within_5d} сигнала</p>
              </div>
            </td>
            <td className="text-center py-4 px-4">
              <p className="text-lg font-semibold text-gray-700">≥{processTarget}%</p>
            </td>
            <td className="text-center py-4 px-4">
              <StatusBadge status={processStatus} />
            </td>
          </tr>

          {/* TTR Row */}
          <tr className="hover:bg-gray-50">
            <td className="py-4 px-4">
              <div>
                <p className="font-medium text-gray-900">TTR Медиана</p>
                <p className="text-sm text-gray-500">Time To Resolution</p>
              </div>
            </td>
            <td className="text-center py-4 px-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.ttr_median_days} дни
                </p>
                <p className="text-sm text-gray-500">
                  {data.ttr_over_14d} над 14 дни
                </p>
              </div>
            </td>
            <td className="text-center py-4 px-4">
              <p className="text-lg font-semibold text-gray-700">≤{ttrTarget} дни</p>
            </td>
            <td className="text-center py-4 px-4">
              <StatusBadge status={ttrStatus} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 mb-1">Изпълнени SLA</p>
          <p className="text-2xl font-bold text-green-900">
            {[ttaStatus, processStatus, ttrStatus].filter((s) => s === "success").length}/3
          </p>
        </div>

        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700 mb-1">Просрочени TTA</p>
          <p className="text-2xl font-bold text-red-900">{data.tta_overdue}</p>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Средно TTR</p>
          <p className="text-2xl font-bold text-blue-900">{data.ttr_median_days} дни</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "success" | "warning" | "danger" }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
        <CheckCircle className="h-4 w-4" />
        OK
      </span>
    );
  }

  if (status === "warning") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
        <Clock className="h-4 w-4" />
        Внимание
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
      <XCircle className="h-4 w-4" />
      Критично
    </span>
  );
}

import { SignalStatus } from "@/types/operator";
import { calculateSLAStatus } from "@/lib/operator/sla-utils";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  sla: {
    tta_deadline?: string;
    process_deadline?: string;
    ttr_deadline?: string;
    tta_status: "ok" | "warning" | "overdue";
    process_status?: "ok" | "warning" | "overdue";
  };
  status: SignalStatus;
}

export function SLAProgress({ sla, status }: Props) {
  const ttaSLA = sla.tta_deadline ? calculateSLAStatus(sla.tta_deadline) : null;
  const processSLA = sla.process_deadline
    ? calculateSLAStatus(sla.process_deadline)
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        SLA Индикатори
      </h3>

      <div className="space-y-4">
        {/* TTA */}
        {status === "novo" && ttaSLA && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Time To Acknowledge (TTA)
              </span>
              <span className="text-xs text-gray-500">≤48ч</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  ttaSLA.status === "ok"
                    ? "bg-green-500"
                    : ttaSLA.status === "warning"
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: ttaSLA.status === "overdue" ? "100%" : "60%"
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{ttaSLA.text}</p>
          </div>
        )}

        {/* Process Deadline */}
        {status === "potvurden" && processSLA && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                До "В процес"
              </span>
              <span className="text-xs text-gray-500">≤5 дни</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  processSLA.status === "ok"
                    ? "bg-green-500"
                    : processSLA.status === "warning"
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: processSLA.status === "overdue" ? "100%" : "40%"
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{processSLA.text}</p>
          </div>
        )}

        {/* Completed States */}
        {(status === "popraven" || status === "arhiv") && (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg text-green-700">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">SLA изпълнен</p>
              <p className="text-xs">Сигналът е завършен успешно</p>
            </div>
          </div>
        )}

        {/* Rejected */}
        {status === "otkhvurlen" && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-gray-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Отклонен</p>
              <p className="text-xs">SLA не се прилага</p>
            </div>
          </div>
        )}

        {/* TTR Target */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Цел TTR:</strong> Медиана ≤14 дни
          </p>
        </div>
      </div>
    </div>
  );
}

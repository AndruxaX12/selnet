import { Signal, SignalStatus } from "@/types/operator";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_TRANSITIONS
} from "@/lib/operator/constants";
import { calculateSLAStatus } from "@/lib/operator/sla-utils";
import { SLAChip } from "../inbox/SLAChip";
import { MapPin, Calendar, User, Building2, CheckCircle, ArrowRight, XCircle } from "lucide-react";
import { useState } from "react";

interface Props {
  data: Signal;
  onTransition: (toStatus: SignalStatus, payload?: Record<string, any>) => Promise<void>;
}

export function SignalHeader({ data, onTransition }: Props) {
  const [transitioning, setTransitioning] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const availableTransitions = STATUS_TRANSITIONS[data.status] || [];
  const ttaSLA = data.sla.tta_deadline ? calculateSLAStatus(data.sla.tta_deadline) : null;
  const processSLA = data.sla.process_deadline
    ? calculateSLAStatus(data.sla.process_deadline)
    : null;

  const handleTransition = async (toStatus: SignalStatus) => {
    if (toStatus === "otkhvurlen") {
      setShowRejectModal(true);
      return;
    }

    setTransitioning(true);
    await onTransition(toStatus);
    setTransitioning(false);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="p-6">
        {/* Title & Status */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.title}</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span>{data.address}</span>
            </div>
          </div>

          <span
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              STATUS_COLORS[data.status]
            }`}
          >
            {STATUS_LABELS[data.status]}
          </span>
        </div>

        {/* SLA Indicators */}
        <div className="flex flex-wrap gap-3 mb-6">
          {ttaSLA && data.status === "novo" && <SLAChip sla={ttaSLA} label="TTA" />}
          {processSLA && data.status === "potvurden" && (
            <SLAChip sla={processSLA} label="До В процес" />
          )}
        </div>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Създаден: {new Date(data.created_at).toLocaleDateString("bg-BG")}
          </span>
          {data.owner_name && (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {data.owner_name}
            </span>
          )}
          {data.department_name && (
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {data.department_name}
            </span>
          )}
          <span className="ml-auto text-xs text-gray-400">ID: {data.id.slice(0, 12)}</span>
        </div>

        {/* Action Buttons */}
        {availableTransitions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {availableTransitions.map((toStatus) => {
              const isReject = toStatus === "otkhvurlen";
              const isConfirm = toStatus === "potvurden";
              const isProcess = toStatus === "v_proces";
              const isFixed = toStatus === "popraven";

              return (
                <button
                  key={toStatus}
                  onClick={() => handleTransition(toStatus)}
                  disabled={transitioning}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    isReject
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : isConfirm
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : isProcess
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : isFixed
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-primary-600 text-white hover:bg-primary-700"
                  }`}
                >
                  {isReject ? (
                    <XCircle className="h-5 w-5" />
                  ) : isFixed || isConfirm ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <ArrowRight className="h-5 w-5" />
                  )}
                  {STATUS_LABELS[toStatus]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          signalId={data.id}
          onConfirm={async (reason) => {
            setTransitioning(true);
            await onTransition("otkhvurlen", { reason });
            setTransitioning(false);
            setShowRejectModal(false);
          }}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </div>
  );
}

// Reject Modal Component
function RejectModal({
  signalId,
  onConfirm,
  onCancel
}: {
  signalId: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Отклоняване на сигнал
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Моля, посочете причина за отклоняване. Подателят ще бъде уведомен.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Причина за отклоняване..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Отказ
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
          >
            Отклони
          </button>
        </div>
      </div>
    </div>
  );
}

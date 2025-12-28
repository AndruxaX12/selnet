import { Signal } from "@/types/operator";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/operator/constants";
import { calculateSLAStatus, formatRelativeTime } from "@/lib/operator/sla-utils";
import Link from "next/link";
import {
  MapPin,
  MessageSquare,
  Image as ImageIcon,
  Eye,
  Star,
  Infinity,
  AlertTriangle,
  User,
  Building2,
  CheckCircle,
  ArrowRight,
  XCircle
} from "lucide-react";
import { SLAChip } from "./SLAChip";

interface Props {
  data: Signal;
  selected: boolean;
  onSelect: () => void;
  onAction: () => void;
}

export function SignalRow({ data, selected, onSelect, onAction }: Props) {
  const ttaSLA = calculateSLAStatus(data.sla.tta_deadline);
  const processSLA = data.sla.process_deadline
    ? calculateSLAStatus(data.sla.process_deadline)
    : null;

  return (
    <div
      className={`bg-white rounded-lg border-2 transition-all hover:shadow-md ${
        selected ? "border-primary-500 bg-primary-50" : "border-gray-200"
      }`}
    >
      <div className="p-4">
        <div className="flex gap-4">
          {/* Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <Link
                  href={`/operator/signals/${data.id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {data.title}
                </Link>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  STATUS_COLORS[data.status]
                }`}
              >
                {STATUS_LABELS[data.status]}
              </span>
            </div>

            {/* SLA Chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {data.status === "novo" && <SLAChip sla={ttaSLA} label="TTA" />}
              {data.status === "potvurden" && processSLA && (
                <SLAChip sla={processSLA} label="До В процес" />
              )}
            </div>

            {/* Category & Address */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="font-medium text-primary-600">{data.category_name}</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {data.address}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-700 line-clamp-2 mb-3">{data.description}</p>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {/* Comments */}
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {data.comments_count}
              </span>

              {/* Media */}
              <span className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                {data.media_count}
              </span>

              {/* Views */}
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {data.views_count}
              </span>

              {/* Owner */}
              {data.owner_name && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {data.owner_name}
                </span>
              )}

              {/* Department */}
              {data.department_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {data.department_name}
                </span>
              )}

              <span className="ml-auto text-xs">
                {formatRelativeTime(data.created_at)}
              </span>
            </div>

            {/* Icons Strip */}
            <div className="flex items-center gap-3 mt-3">
              {/* Priority */}
              {data.priority !== "normal" && (
                <Star
                  className={`h-5 w-5 ${PRIORITY_COLORS[data.priority]}`}
                  fill="currentColor"
                />
              )}

              {/* Duplicate */}
              {data.has_duplicates && (
                <span title="Има дубликати">
                  <Infinity className="h-5 w-5 text-blue-500" />
                </span>
              )}

              {/* Complaint */}
              {data.has_complaint && (
                <span title="Има жалба">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {data.status === "novo" && (
                <button
                  onClick={onAction}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <CheckCircle className="h-4 w-4" />
                  Потвърди
                </button>
              )}

              {data.status === "potvurden" && (
                <button
                  onClick={onAction}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <ArrowRight className="h-4 w-4" />
                  В процес
                </button>
              )}

              {data.status === "v_proces" && (
                <button
                  onClick={onAction}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <CheckCircle className="h-4 w-4" />
                  Поправен
                </button>
              )}

              <button
                onClick={onAction}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <XCircle className="h-4 w-4" />
                Отклони
              </button>

              <Link
                href={`/operator/signals/${data.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium ml-auto"
              >
                Детайли
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Signal } from "@/types/operator";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/operator/constants";
import { calculateSLAStatus } from "@/lib/operator/sla-utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";
import { SLAChip } from "@/components/operator/inbox/SLAChip";

interface Props {
  data: Signal;
  selected: boolean;
  onSelect: () => void;
  onAction: () => void;
}

export function AdminSignalRow({ data, selected, onSelect, onAction }: Props) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "bg";
  
  const ttaSLA = data.sla?.tta_deadline ? calculateSLAStatus(data.sla.tta_deadline) : null;
  const processSLA = data.sla?.process_deadline
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
                  href={`/${locale}/admin/signals/${data.id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {data.title}
                </Link>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  STATUS_COLORS[data.status] || "bg-gray-100 text-gray-800 border-gray-200"
                }`}
              >
                {STATUS_LABELS[data.status] || data.status}
              </span>
            </div>

            {/* SLA Chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {data.status === "novo" && ttaSLA && <SLAChip sla={ttaSLA} label="TTA" />}
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
               {data.media_count > 0 && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  {data.media_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Signal } from "@/types/operator";
import { formatDateTime } from "@/lib/operator/sla-utils";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  Calendar,
  Eye,
  MessageSquare,
  Image as ImageIcon,
  Star
} from "lucide-react";
import { PRIORITY_LABELS } from "@/lib/operator/constants";

interface Props {
  data: Signal;
}

export function MetadataCard({ data }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация</h3>

      <div className="space-y-4">
        {/* Reporter */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <User className="h-4 w-4" />
            <span className="font-medium">Подател</span>
          </div>
          <p className="text-gray-900 pl-6">{data.reporter.name || "Анонимен"}</p>
          {data.reporter.contact_masked && (
            <p className="text-gray-500 pl-6 text-sm">{data.reporter.contact_masked}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Tag className="h-4 w-4" />
            <span className="font-medium">Категория</span>
          </div>
          <p className="text-gray-900 pl-6">{data.category_name || data.category_id}</p>
        </div>

        {/* Priority */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Star className="h-4 w-4" />
            <span className="font-medium">Приоритет</span>
          </div>
          <p className="text-gray-900 pl-6">{PRIORITY_LABELS[data.priority]}</p>
        </div>

        {/* Location */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Адрес</span>
          </div>
          <p className="text-gray-900 pl-6">{data.address}</p>
          <p className="text-gray-500 pl-6 text-xs">
            {data.coordinates.lat.toFixed(4)}, {data.coordinates.lng.toFixed(4)}
          </p>
        </div>

        {/* Created At */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Създаден</span>
          </div>
          <p className="text-gray-900 pl-6">{formatDateTime(data.created_at)}</p>
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-3">Статистики</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <p className="text-xl font-semibold text-gray-900">{data.comments_count}</p>
              <p className="text-xs text-gray-500">Коментари</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <ImageIcon className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <p className="text-xl font-semibold text-gray-900">{data.media_count}</p>
              <p className="text-xs text-gray-500">Снимки</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <Eye className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <p className="text-xl font-semibold text-gray-900">{data.views_count}</p>
              <p className="text-xs text-gray-500">Гледания</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

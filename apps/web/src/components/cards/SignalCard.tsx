"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, MessageCircle, ThumbsUp, Eye, Share2, AlertTriangle } from "lucide-react";
import type { SignalCardDTO } from "@/types/signals";
import { StatusBadge, PriorityBadge, SLABadge } from "@/components/public/StatusBadges";
import { SIGNAL_CATEGORY_LABELS } from "@/types/signals";
import { formatRelativeTime, calculateSLAStatus } from "@/lib/utils/date";
import { truncateText, formatCompactNumber, formatDistance } from "@/lib/utils/format";

interface SignalCardProps {
  signal: SignalCardDTO;
  position?: number;
  onSupport?: (id: string) => void;
  onWatch?: (id: string) => void;
  onShare?: (id: string) => void;
}

/**
 * SignalCard - Карта за визуализация на сигнал
 */
export function SignalCard({ signal, position = 0, onSupport, onWatch, onShare }: SignalCardProps) {
  const coverImage = signal.photos?.[0] || null;
  const categoryLabel = SIGNAL_CATEGORY_LABELS[signal.category] || signal.category;
  const slaStatus = calculateSLAStatus(
    signal.created_at,
    signal.status,
    signal.sla?.tta_hours || 0
  );
  const pathname = window.location.pathname;
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;



  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare?.(signal.id);
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
      <Link href={`${base}/signals/${signal.id}`} className="block">
        {/* Cover Image */}
        <div className="relative h-48 bg-gray-100">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={signal.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <AlertTriangle className="h-16 w-16" />
            </div>
          )}

          {/* Status Badge - Top Left */}
          <div className="absolute top-3 left-3">
            <StatusBadge status={signal.status} type="signal" />
          </div>

          {/* Priority Badge - Top Right */}
          {(signal.priority === 'high' || signal.priority === 'urgent') && (
            <div className="absolute top-3 right-3">
              <PriorityBadge priority={signal.priority} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {signal.title}
          </h3>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{signal.location.address}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-3">
            {truncateText(signal.description, 3)}
          </p>

          {/* Category */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {categoryLabel}
            </span>
          </div>

          {/* SLA Indicator */}
          {slaStatus.label && (
            <div>
              <SLABadge
                label={slaStatus.label}
                variant={slaStatus.variant}
                tooltip={`SLA статус за потвърждение на сигнала`}
              />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 pt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1" title={`${signal.comments_count} коментара`}>
              <MessageCircle className="h-4 w-4" />
              <span>{formatCompactNumber(signal.comments_count)}</span>
            </div>
            <div className="flex items-center gap-1" title={`${signal.votes_support} подкрепа`}>
              <ThumbsUp className="h-4 w-4" />
              <span>{formatCompactNumber(signal.votes_support)}</span>
            </div>
            <div className="flex items-center gap-1" title={`${signal.watchers} следят`}>
              <Eye className="h-4 w-4" />
              <span>{formatCompactNumber(signal.watchers)}</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            {formatRelativeTime(signal.created_at)}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Link
          href={`${base}/signals/${signal.id}`}
          className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium text-center transition-colors"
        >
          Виж детайли
        </Link>
        <button
          onClick={handleShare}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
          title="Сподели"
          aria-label="Сподели сигнала"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

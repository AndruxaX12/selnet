"use client";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, Download, Video } from "lucide-react";
import type { EventCardDTO } from "@/types/events";
import { CategoryBadge } from "@/components/public/StatusBadges";
import { EVENT_CATEGORY_LABELS } from "@/types/events";
import { formatEventPeriod, formatDate } from "@/lib/utils/date";
import { formatCompactNumber } from "@/lib/utils/format";
import { downloadICS } from "@/lib/api/events-api";

interface EventCardProps {
  event: EventCardDTO;
  position?: number;
  onRSVP?: (id: string, status: 'going' | 'interested') => void;
}

/**
 * EventCard - Карта за визуализация на събитие
 */
export function EventCard({ event, position = 0, onRSVP }: EventCardProps) {
  const categoryLabel = EVENT_CATEGORY_LABELS[event.category] || event.category;
  const eventDate = new Date(event.start_at);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleDateString('bg-BG', { month: 'short' });

  const handleRSVP = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRSVP?.(event.id, 'going');
  };

  const handleDownloadICS = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    downloadICS(event);
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
      <Link href={`/events/${event.id}`} className="block">
        {/* Poster or Date Badge */}
        <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
          {event.poster ? (
            <Image
              src={event.poster}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            // Date badge when no poster
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-center">
              <div className="text-3xl font-bold text-gray-900">{day}</div>
              <div className="text-sm text-gray-600 uppercase">{month}</div>
            </div>
          )}

          {/* Online indicator */}
          {event.is_online && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                <Video className="h-3 w-3" />
                Онлайн
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>

          {/* Date & Time */}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{formatEventPeriod(event.start_at, event.end_at)}</span>
          </div>

          {/* Location */}
          {event.location && !event.is_online && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{event.location.address}</span>
            </div>
          )}

          {/* Category & Organizer */}
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge label={categoryLabel} variant="primary" />
            <span className="text-xs text-gray-500">от {event.organizer}</span>
          </div>

          {/* RSVPs */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>
              <span className="font-semibold">{formatCompactNumber(event.rsvp_count)}</span> 
              {' '}участници
            </span>
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={handleRSVP}
          className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          Идвам
        </button>
        <button
          onClick={handleDownloadICS}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
          title="Добави в календар"
          aria-label="Изтегли .ics файл"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

// API функции за събития

import { api, buildQueryString } from './client';
import type { EventCardDTO, EventListResponse, EventFilters } from '@/types/events';

/**
 * Зареждане на списък със събития
 */
export async function fetchEvents(filters: EventFilters = {}): Promise<EventListResponse> {
  const defaultFilters: EventFilters = {
    sort: 'start_at', // upcoming first
    when: 'upcoming',
    limit: 20,
    ...filters,
  };

  const queryString = buildQueryString(defaultFilters);
  
  try {
    return await api.get<EventListResponse>(`/events${queryString}`, {
      cacheTTL: 60 * 1000, // 60s cache
    });
  } catch (error) {
    console.error('[API] Failed to fetch events:', error);
    throw error;
  }
}

/**
 * Зареждане на едно събитие по ID
 */
export async function fetchEventById(id: string): Promise<EventCardDTO> {
  try {
    return await api.get<EventCardDTO>(`/events/${id}`);
  } catch (error) {
    console.error(`[API] Failed to fetch event ${id}:`, error);
    throw error;
  }
}

/**
 * RSVP за събитие
 */
export async function rsvpEvent(
  id: string, 
  status: 'going' | 'interested' | 'not_going'
): Promise<{ success: boolean; rsvp_count: number }> {
  try {
    return await api.post(`/events/${id}/rsvp`, { status }, {
      skipCache: true,
    });
  } catch (error) {
    console.error(`[API] Failed to RSVP event ${id}:`, error);
    throw error;
  }
}

/**
 * Генериране на .ics календарен файл
 */
export function generateICS(event: EventCardDTO): string {
  const formatDate = (date: string) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SelNet//BG',
    'BEGIN:VEVENT',
    `UID:${event.id}@selnet.bg`,
    `DTSTAMP:${formatDate(new Date().toISOString())}`,
    `DTSTART:${formatDate(event.start_at)}`,
    `DTEND:${formatDate(event.end_at)}`,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location.address}` : '',
    `DESCRIPTION:Организатор: ${event.organizer}`,
    `URL:${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.id}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  return ics;
}

/**
 * Download .ics файл
 */
export function downloadICS(event: EventCardDTO) {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Tracking на RSVP
 */
export function trackEventRSVP(id: string, status: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'rsvp', {
      content_type: 'event',
      content_id: id,
      rsvp_status: status,
    });
  }
}

/**
 * Tracking на клик по събитие
 */
export function trackEventClick(id: string, position: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'select_content', {
      content_type: 'event',
      content_id: id,
      index: position,
    });
  }
}

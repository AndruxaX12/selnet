// События - типове и енуми

export type EventStatus = 'published' | 'archived';

export type EventCategory = 
  | 'community'      // Общност
  | 'culture'        // Култура
  | 'sport'          // Спорт
  | 'education'      // Образование
  | 'ecology'        // Екология
  | 'social'         // Социални
  | 'meeting'        // Събрания
  | 'other';         // Друго

export type EventPeriod = 'today' | 'weekend' | 'month' | 'past' | 'upcoming';

export interface EventLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface EventCardDTO {
  id: string;
  title: string;
  start_at: string;      // ISO 8601
  end_at: string;        // ISO 8601
  location?: EventLocation;
  is_online: boolean;
  organizer: string;
  category: EventCategory;
  poster?: string;
  rsvp_count: number;
  status: EventStatus;
  created_at: string;
}

export interface EventListResponse {
  items: EventCardDTO[];
  total: number;
  next_cursor?: string;
}

export interface EventFilters {
  when?: EventPeriod;
  category?: EventCategory[];
  online?: boolean;  // true = online only, false = in-person only, undefined = both
  q?: string;
  sort?: string; // "start_at" | "-created_at" | "-rsvp_count"
  limit?: number;
  cursor?: string;
}

// UI Labels
export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  community: 'Общност',
  culture: 'Култура',
  sport: 'Спорт',
  education: 'Образование',
  ecology: 'Екология',
  social: 'Социални',
  meeting: 'Събрания',
  other: 'Друго'
};

export const EVENT_PERIOD_LABELS: Record<EventPeriod, string> = {
  today: 'Днес',
  weekend: 'Уикенд',
  month: 'Този месец',
  past: 'Минали',
  upcoming: 'Предстоящи'
};

// Legacy types (за обратна съвместимост)
export type EventRSVP = {
  by: string;      // uid
  v: "going" | "interested";
  at: number;
};

export type CalEvent = {
  id: string;
  title: string;
  when: number;
  durationMin?: number;
  where?: string;
  desc?: string;
  goingCount?: number;
  interestedCount?: number;
};

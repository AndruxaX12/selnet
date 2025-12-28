// Сигнали - типове и енуми

export type SignalStatus = 
  | 'novo'           // Нов
  | 'v_process'      // В процес
  | 'zavarsheno'     // Завършен
  | 'othvarlen';     // Отхвърлен

export type SignalPriority = 'low' | 'normal' | 'high' | 'urgent';

export type SignalCategory = 
  | 'Пожар'                 // Пожар
  | 'ВиК'                   // Водоснабдяване и канализация
  | 'Ток'                   // Електрозахранване
  | 'Пътища и тротоари'     // Пътища и тротоари
  | 'отпадъци'              // Сметище/Отпадъци
  | 'Осветление'            // Улично осветление
  | 'Транспорт'             // Транспортни проблеми
  | 'Шум'                   // Шумово замърсяване
  | 'Друго';                // Други проблеми

export interface SignalLocation {
  address: string;
  full_address: string,
  lat: number;
  lng: number;
}

export interface SignalSLA {
  tta_hours: number | null;  // Time to acknowledgment (hours)
  ttr_days: number | null;   // Time to resolve (days)
  overdue: boolean;
}

export interface SignalCardDTO {
  id: string;
  title: string;
  description: string;
  photos: string[];
  location: SignalLocation;
  status: SignalStatus;
  priority: SignalPriority;
  category: SignalCategory;
  comments_count: number;
  votes_support: number;
  watchers: number;
  sla: SignalSLA;
  created_at: string;
  updated_at: string;
}

export interface SignalListResponse {
  items: SignalCardDTO[];
  total: number;
  next_cursor?: string;
}

export interface SignalFilters {
  status?: SignalStatus[];
  category?: SignalCategory[];
  priority?: SignalPriority[];
  hasPhotos?: boolean;
  bbox?: string; // "lat1,lng1,lat2,lng2"
  q?: string;    // Search query
  sort?: string; // "-created_at" | "-votes_support" | "-comments_count" | "distance"
  limit?: number;
  cursor?: string;
  mine?: boolean; // Filter by current user's signals
  district?: string; // Filter by settlement/district
}

// UI Labels
export const SIGNAL_STATUS_LABELS: Record<SignalStatus, string> = {
  novo: 'Нов',
  v_process: 'В процес',
  zavarsheno: 'Завършен',
  othvarlen: 'Отхвърлен'
};

export const SIGNAL_STATUS_COLORS: Record<SignalStatus, string> = {
  novo: 'bg-red-100 text-red-800 border-red-300',
  v_process: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  zavarsheno: 'bg-green-100 text-green-800 border-green-300',
  othvarlen: 'bg-gray-100 text-gray-800 border-gray-300'
};

export const SIGNAL_PRIORITY_LABELS: Record<SignalPriority, string> = {
  low: 'Нисък',
  normal: 'Нормален',
  high: 'Висок',
  urgent: 'Спешен'
};

export const SIGNAL_CATEGORY_LABELS: Record<SignalCategory, string> = {
  'Пожар': '🔥 Пожар',
  'ВиК': '💧 ВиК',
  'Ток': '⚡ Ток',
  'Пътища и тротоари': '🛣️ Пътища и тротоари',
  'отпадъци': '🗑️ Сметище/Отпадъци',
  'Осветление': '💡 Осветление',
  'Транспорт': '🚗 Транспорт',
  'Шум': '🔊 Шум',
  'Друго': '📌 Друго'
};

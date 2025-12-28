// Идеи - типове и енуми

export type IdeaStatus = 
  | 'novo'              // Ново
  | 'obsuzhdane'        // Обсъждане
  | 'v_razrabotka'      // В разработка
  | 'planirano'         // Планирано
  | 'otkhvurleno'       // Отхвърлено
  | 'arhiv';            // Архив

export type IdeaCategory = 
  | 'infrastructure'    // Инфраструктура
  | 'transport'         // Транспорт
  | 'ecology'           // Екология
  | 'education'         // Образование
  | 'culture'           // Култура
  | 'sport'             // Спорт
  | 'social'            // Социални дейности
  | 'other';            // Друго

export interface IdeaAuthor {
  name: string;
  role?: string;
}

export interface IdeaCardDTO {
  id: string;
  title: string;
  summary: string;
  author: IdeaAuthor;
  category: IdeaCategory;
  tags: string[];
  attachments: string[];
  status: IdeaStatus;
  support_count: number;
  comments_count: number;
  deadline?: string;
  created_at: string;
}

export interface IdeaListResponse {
  items: IdeaCardDTO[];
  total: number;
  next_cursor?: string;
}

export interface IdeaFilters {
  status?: IdeaStatus[];
  category?: IdeaCategory[];
  tags?: string[];
  openSupport?: boolean;
  q?: string;
  sort?: string; // "-created_at" | "-support_count" | "-comments_count"
  limit?: number;
  cursor?: string;
}

// UI Labels
export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  novo: 'Ново',
  obsuzhdane: 'Обсъждане',
  v_razrabotka: 'В разработка',
  planirano: 'Планирано',
  otkhvurleno: 'Отхвърлено',
  arhiv: 'Архив'
};

export const IDEA_STATUS_COLORS: Record<IdeaStatus, string> = {
  novo: 'bg-gray-100 text-gray-800 border-gray-300',
  obsuzhdane: 'bg-blue-100 text-blue-800 border-blue-300',
  v_razrabotka: 'bg-purple-100 text-purple-800 border-purple-300',
  planirano: 'bg-green-100 text-green-800 border-green-300',
  otkhvurleno: 'bg-red-100 text-red-800 border-red-300',
  arhiv: 'bg-slate-100 text-slate-800 border-slate-300'
};

export const IDEA_CATEGORY_LABELS: Record<IdeaCategory, string> = {
  infrastructure: 'Инфраструктура',
  transport: 'Транспорт',
  ecology: 'Екология',
  education: 'Образование',
  culture: 'Култура',
  sport: 'Спорт',
  social: 'Социални дейности',
  other: 'Друго'
};

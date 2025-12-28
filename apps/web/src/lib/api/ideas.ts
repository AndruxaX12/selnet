// API функции за идеи

import { api, buildQueryString } from './client';
import type { IdeaCardDTO, IdeaListResponse, IdeaFilters } from '@/types/ideas';

/**
 * Зареждане на списък с идеи
 */
export async function fetchIdeas(filters: IdeaFilters = {}): Promise<IdeaListResponse> {
  const defaultFilters: IdeaFilters = {
    sort: '-created_at',
    limit: 20,
    ...filters,
  };

  const queryString = buildQueryString(defaultFilters);
  
  try {
    return await api.get<IdeaListResponse>(`/ideas${queryString}`, {
      cacheTTL: 60 * 1000, // 60s cache
    });
  } catch (error) {
    console.error('[API] Failed to fetch ideas:', error);
    throw error;
  }
}

/**
 * Зареждане на една идея по ID
 */
export async function fetchIdeaById(id: string): Promise<IdeaCardDTO> {
  try {
    return await api.get<IdeaCardDTO>(`/ideas/${id}`);
  } catch (error) {
    console.error(`[API] Failed to fetch idea ${id}:`, error);
    throw error;
  }
}

/**
 * Подкрепа на идея
 */
export async function supportIdea(id: string): Promise<{ success: boolean; support_count: number }> {
  try {
    return await api.post(`/ideas/${id}/support`, {}, {
      skipCache: true,
    });
  } catch (error) {
    console.error(`[API] Failed to support idea ${id}:`, error);
    throw error;
  }
}

/**
 * Tracking на клик по идея
 */
export function trackIdeaClick(id: string, position: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'select_content', {
      content_type: 'idea',
      content_id: id,
      index: position,
    });
  }
}

/**
 * Tracking на подкрепа
 */
export function trackIdeaSupport(id: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'support', {
      content_type: 'idea',
      content_id: id,
    });
  }
}

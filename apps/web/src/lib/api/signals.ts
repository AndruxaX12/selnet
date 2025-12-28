// API функции за сигнали

import { api, buildQueryString, type RequestOptions } from './client';
import type { SignalCardDTO, SignalListResponse, SignalFilters } from '@/types/signals';

/**
 * Зареждане на списък със сигнали
 */
export async function fetchSignals(filters: SignalFilters = {}): Promise<SignalListResponse> {
  const defaultFilters: SignalFilters = {
    sort: '-created_at',
    limit: 20,
    ...filters,
  };

  

  // If mine=true is specified, we need to include credentials and skip cache
  const options: RequestOptions = {
    cacheTTL: 60 * 1000, // 60s cache
    credentials: (filters as { mine?: boolean }).mine ? 'include' : 'same-origin',
    skipCache: (filters as { mine?: boolean }).mine ? true : false, // Always fetch fresh for "mine" to ensure auth
  };

  const queryString = buildQueryString(defaultFilters);
  
  try {
    return await api.get<SignalListResponse>(`/signals${queryString}`, options);
  } catch (error) {
    console.error('[API] Failed to fetch signals:', error);
    throw error;
  }
}

/**
 * Зареждане на един сигнал по ID
 */
export async function fetchSignalById(id: string): Promise<SignalCardDTO> {
  try {
    return await api.get<SignalCardDTO>(`/signals/${id}`);
  } catch (error) {
    console.error(`[API] Failed to fetch signal ${id}:`, error);
    throw error;
  }
}

/**
 * Подкрепа на сигнал
 */
export async function supportSignal(id: string): Promise<{ success: boolean; votes: number }> {
  try {
    return await api.post(`/signals/${id}/support`, {}, {
      skipCache: true,
    });
  } catch (error) {
    console.error(`[API] Failed to support signal ${id}:`, error);
    throw error;
  }
}

/**
 * Следене на сигнал
 */
export async function watchSignal(id: string): Promise<{ success: boolean; watching: boolean }> {
  try {
    return await api.post(`/signals/${id}/watch`, {}, {
      skipCache: true,
    });
  } catch (error) {
    console.error(`[API] Failed to watch signal ${id}:`, error);
    throw error;
  }
}

/**
 * Споделяне на сигнал (tracking)
 */
export function trackSignalShare(id: string, method: 'link' | 'social') {
  // Analytics tracking
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'share', {
      content_type: 'signal',
      content_id: id,
      method: method,
    });
  }
}

/**
 * Tracking на клик по сигнал
 */
export function trackSignalClick(id: string, position: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'select_content', {
      content_type: 'signal',
      content_id: id,
      index: position,
    });
  }
}

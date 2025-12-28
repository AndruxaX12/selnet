// API Client с error handling, retry логика и кеширане

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const CACHE_TTL = 60 * 1000; // 60 секунди

// In-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export interface RequestOptions extends RequestInit {
  skipCache?: boolean;
  cacheTTL?: number;
  retry?: number;
}

/**
 * Основна fetch функция с error handling и кеширане
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    skipCache = false,
    cacheTTL = CACHE_TTL,
    retry = 0,
    ...fetchOptions
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const cacheKey = `${url}${JSON.stringify(fetchOptions)}`;

  // Проверка на кеша (само за GET)
  if (!skipCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return cached.data as T;
    }
  }

  let lastError: Error | null = null;
  const maxRetries = retry;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        credentials: fetchOptions.credentials || 'same-origin', // Include credentials for authenticated requests
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          // Не е JSON, използвай текста
        }

        throw new APIError(
          errorMessage,
          response.status,
          response.status === 404 ? 'NOT_FOUND' : 
          response.status === 401 ? 'UNAUTHORIZED' :
          response.status === 403 ? 'FORBIDDEN' :
          response.status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN'
        );
      }

      const data = await response.json();

      // Кеширай резултата
      if (!skipCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
        cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data as T;

    } catch (error) {
      lastError = error as Error;

      // Не retry-вай при клиентски грешки (4xx)
      if (error instanceof APIError && error.status && error.status < 500) {
        throw error;
      }

      // Retry при мрежови грешки и 5xx
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Helper функции за HTTP методи
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Изчистване на кеша
 */
export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Проверка за онлайн статус
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Build query string от обект
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.set(key, `in(${value.join(',')})`);
      }
    } else {
      searchParams.set(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

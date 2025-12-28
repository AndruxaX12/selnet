import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Custom hook for performance optimizations
 */
export function usePerformance() {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
  });

  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  const memoizedValue = useMemo(() => ({
    renderCount: renderCount.current,
    renderTime: Date.now() - startTime.current,
  }), []);

  return {
    debounce,
    throttle,
    performance: memoizedValue,
  };
}

/**
 * Hook for lazy loading components when they enter viewport
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const isIntersecting = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    observer.current = new IntersectionObserver(([entry]) => {
      isIntersecting.current = entry.isIntersecting;
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });

    observer.current.observe(elementRef.current);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [elementRef, options]);

  return isIntersecting.current;
}

/**
 * Hook for preloading resources
 */
export function usePreload() {
  const preloadedResources = useRef(new Set<string>());

  const preloadImage = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;
    
    const img = new Image();
    img.src = src;
    preloadedResources.current.add(src);
  }, []);

  const preloadScript = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
    preloadedResources.current.add(src);
  }, []);

  const preloadCSS = useCallback((href: string) => {
    if (preloadedResources.current.has(href)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
    preloadedResources.current.add(href);
  }, []);

  return {
    preloadImage,
    preloadScript,
    preloadCSS,
  };
}

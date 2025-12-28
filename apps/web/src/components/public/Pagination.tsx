"use client";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface PaginationProps {
  currentCount: number;
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  useInfiniteScroll?: boolean;
}

/**
 * Pagination компонент с infinite scroll
 */
export function Pagination({
  currentCount,
  totalCount,
  hasMore,
  isLoading,
  onLoadMore,
  useInfiniteScroll = true,
}: PaginationProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll с Intersection Observer
  useEffect(() => {
    if (!useInfiniteScroll || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, isLoading, onLoadMore, useInfiniteScroll]);

  return (
    <div className="mt-8 space-y-4">
      {/* Counter */}
      <div className="text-center text-sm text-gray-600">
        Показани <span className="font-semibold">{currentCount}</span> от{' '}
        <span className="font-semibold">{totalCount}</span>
      </div>

      {/* Load more button or infinite scroll trigger */}
      {hasMore && (
        <>
          {useInfiniteScroll ? (
            <div ref={observerTarget} className="flex justify-center py-4">
              {isLoading && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="px-6 py-3 rounded-lg bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Зареждане...
                  </span>
                ) : (
                  'Покажи още'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* End message */}
      {!hasMore && currentCount > 0 && (
        <div className="text-center text-sm text-gray-500 py-4">
          Няма повече елементи за показване
        </div>
      )}
    </div>
  );
}

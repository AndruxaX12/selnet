"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { ListHeader } from "@/components/layout/ListHeader";
import { SignalFiltersBar } from "@/components/filters/SignalFilters";
import { SignalCard } from "@/components/cards/SignalCard";
import { SkeletonGrid } from "@/components/public/Skeleton";
import { EmptyState, ErrorState, OfflineState } from "@/components/public/EmptyState";
import { Pagination } from "@/components/public/Pagination";
import { fetchSignals, trackSignalClick } from "@/lib/api/signals";
import { copyToClipboard, getShareUrl } from "@/lib/utils/format";
import { isOnline } from "@/lib/api/client";
import type { SignalFilters, SignalCardDTO } from "@/types/signals";

/**
 * SignalsPageClient - Client component за страница със сигнали
 */
export function SignalsPageClient() {
  const [signals, setSignals] = useState<SignalCardDTO[]>([]);
  // Check if we're on the 'My Signals' page
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isMySignals = useMemo(() => 
    searchParams.get('mine') === 'true' || pathname?.startsWith('/me'),
    [searchParams, pathname]
  );

  const [filters, setFilters] = useState<SignalFilters>(() => ({
    sort: '-created_at',
    limit: 20,
    ...(isMySignals ? { mine: true } : {}),
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);



  // Update filters when URL changes (mine=true param) - only update mine filter
  useEffect(() => {
    const shouldFilterMine = searchParams.get('mine') === 'true' || pathname?.startsWith('/me');
    setFilters(prev => {
      const newMineValue = shouldFilterMine ? true : undefined;
      // Only update if mine value actually changed
      if (prev.mine !== newMineValue) {
        return {
          ...prev,
          mine: newMineValue,
        };
      }
      return prev;
    });
  }, [searchParams, pathname]);

  // Load signals - memoized to prevent infinite loops
  const loadSignals = useCallback(async (append = false, currentFilters: SignalFilters) => {
    if (!isOnline()) {
      setIsOffline(true);
      return;
    }

    setIsOffline(false);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchSignals(currentFilters);

      if (append) {
        setSignals(prev => [...prev, ...response.items]);
      } else {
        setSignals(response.items);
      }

      setTotal(response.total);
      setHasMore(!!response.next_cursor);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load signals:', err);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - filters passed as parameter

  // Initial load and reload when filters change - use filters as stringified dependency
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  useEffect(() => {
    loadSignals(false, filters);
  }, [filtersKey, loadSignals]);

  // Load more
  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    // In real implementation, update cursor from response
    loadSignals(true, filters);
  };

  // Share signal
  const handleShare = async (id: string) => {
    const url = getShareUrl('signal', id);
    const success = await copyToClipboard(url);

    if (success) {
      // Show toast notification
      alert('Линкът е копиран!');
    }
  };

  // Track click
  const handleCardClick = (id: string, position: number) => {
    trackSignalClick(id, position);
  };

  return (
    <div className="w-full bg-gray-50">
      {/* Header */}
      <ListHeader
        title={isMySignals ? "Моите Сигнали" : "Всички Сигнали"}
        description={isMySignals
          ? "Преглед на всички ваши сигнали. Следете тяхното състояние и актуализации."
          : "Преглед на последните подадени сигнали от граждани за проблеми в общината. Подайте сигнал или подкрепете съществуващ."}
        actionLabel="Подай сигнал"
        actionHref="/signals/new"
        icon={<AlertCircle className="h-8 w-8" />}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Offline Banner */}
        {isOffline && (
          <div className="mb-6">
            <OfflineState
              showCached={signals.length > 0}
              onRetry={() => loadSignals(false, filters)}
            />
          </div>
        )}

        {/* Filters - Always visible */}
        <div className="mb-6 w-full">
          <SignalFiltersBar
            filters={filters}
            onChange={setFilters}
            resultCount={total}
          />
        </div>

        {/* Content */}
        {isLoading && signals.length === 0 ? (
          <SkeletonGrid type="signal" count={6} />
        ) : error ? (
          <ErrorState
            title="Грешка при зареждане"
            description={error.message || "Възникна грешка при зареждане на сигналите"}
            onRetry={() => loadSignals(false, filters)}
          />
        ) : signals.length === 0 ? (
          <EmptyState
            type={filters.q || filters.status?.length || filters.category?.length || filters.priority?.length ? 'filter' : 'signal'}
            onClearFilters={() => setFilters({ 
              sort: '-created_at', 
              limit: 20,
              // Preserve mine filter if we're on My Signals page
              ...(isMySignals ? { mine: true } : {})
            })}
          />
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {signals.map((signal, index) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  position={index}
                  onShare={handleShare}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentCount={signals.length}
              totalCount={total}
              hasMore={hasMore}
              isLoading={isLoading}
              onLoadMore={handleLoadMore}
              useInfiniteScroll={true}
            />
          </>
        )}
      </div>
    </div>
  );
}

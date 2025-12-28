"use client";
import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";
import { ListHeader } from "@/components/layout/ListHeader";
import { IdeaFiltersBar } from "@/components/filters/IdeaFilters";
import { IdeaCard } from "@/components/cards/IdeaCard";
import { SkeletonGrid } from "@/components/public/Skeleton";
import { EmptyState, ErrorState, OfflineState } from "@/components/public/EmptyState";
import { Pagination } from "@/components/public/Pagination";
import { fetchIdeas, supportIdea, trackIdeaClick, trackIdeaSupport } from "@/lib/api/ideas";
import { isOnline } from "@/lib/api/client";
import type { IdeaFilters, IdeaCardDTO } from "@/types/ideas";

/**
 * IdeasPageClient - Client component за страница с идеи
 */
export function IdeasPageClient() {
  const [ideas, setIdeas] = useState<IdeaCardDTO[]>([]);
  const [filters, setFilters] = useState<IdeaFilters>({
    sort: '-created_at',
    limit: 20,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Load ideas
  const loadIdeas = async (append = false) => {
    if (!isOnline()) {
      setIsOffline(true);
      return;
    }

    setIsOffline(false);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchIdeas(filters);
      
      if (append) {
        setIdeas(prev => [...prev, ...response.items]);
      } else {
        setIdeas(response.items);
      }
      
      setTotal(response.total);
      setHasMore(!!response.next_cursor);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load ideas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadIdeas();
  }, [filters]);

  // Load more
  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    loadIdeas(true);
  };

  // Support idea
  const handleSupport = async (id: string) => {
    try {
      const result = await supportIdea(id);
      trackIdeaSupport(id);
      
      // Update local state
      setIdeas(prev => prev.map(idea => 
        idea.id === id 
          ? { ...idea, support_count: result.support_count }
          : idea
      ));
      
      // Show toast notification
      alert('Благодарим за подкрепата!');
    } catch (err) {
      console.error('Failed to support idea:', err);
      alert('Грешка при подкрепа на идеята');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ListHeader
        title="Последни Идеи"
        description="Преглед на последните споделени идеи от граждани за подобрение на общината. Споделете идея или подкрепете съществуваща."
        actionLabel="Сподели идея"
        actionHref="/ideas/new"
        icon={<Lightbulb className="h-8 w-8" />}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Offline Banner */}
        {isOffline && (
          <OfflineState 
            showCached={ideas.length > 0}
            onRetry={() => loadIdeas()}
          />
        )}

        {/* Filters */}
        <div className="mb-6">
          <IdeaFiltersBar
            filters={filters}
            onChange={setFilters}
            resultCount={total}
          />
        </div>

        {/* Content */}
        {isLoading && ideas.length === 0 ? (
          <SkeletonGrid type="idea" count={6} />
        ) : error ? (
          <ErrorState
            title="Грешка при зареждане"
            description={error.message || "Възникна грешка при зареждане на идеите"}
            onRetry={() => loadIdeas()}
          />
        ) : ideas.length === 0 ? (
          <EmptyState
            type={filters.q || filters.status?.length || filters.category?.length ? 'filter' : 'idea'}
            onClearFilters={() => setFilters({ sort: '-created_at', limit: 20 })}
          />
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ideas.map((idea, index) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  position={index}
                  onSupport={handleSupport}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentCount={ideas.length}
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

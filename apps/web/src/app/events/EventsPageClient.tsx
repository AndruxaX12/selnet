"use client";
import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { ListHeader } from "@/components/layout/ListHeader";
import { EventFiltersBar } from "@/components/filters/EventFilters";
import { EventCard } from "@/components/cards/EventCard";
import { SkeletonGrid } from "@/components/public/Skeleton";
import { EmptyState, ErrorState, OfflineState } from "@/components/public/EmptyState";
import { Pagination } from "@/components/public/Pagination";
import { fetchEvents, rsvpEvent, trackEventRSVP, trackEventClick } from "@/lib/api/events-api";
import { isOnline } from "@/lib/api/client";
import type { EventFilters, EventCardDTO } from "@/types/events";

/**
 * EventsPageClient - Client component за страница със събития
 */
export function EventsPageClient() {
  const [events, setEvents] = useState<EventCardDTO[]>([]);
  const [filters, setFilters] = useState<EventFilters>({
    sort: 'start_at',
    when: 'upcoming',
    limit: 20,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Load events
  const loadEvents = async (append = false) => {
    if (!isOnline()) {
      setIsOffline(true);
      return;
    }

    setIsOffline(false);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchEvents(filters);
      
      if (append) {
        setEvents(prev => [...prev, ...response.items]);
      } else {
        setEvents(response.items);
      }
      
      setTotal(response.total);
      setHasMore(!!response.next_cursor);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [filters]);

  // Load more
  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    loadEvents(true);
  };

  // RSVP to event
  const handleRSVP = async (id: string, status: 'going' | 'interested') => {
    try {
      const result = await rsvpEvent(id, status);
      trackEventRSVP(id, status);
      
      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? { ...event, rsvp_count: result.rsvp_count }
          : event
      ));
      
      // Show toast notification
      alert('Благодарим! Вашето участие е потвърдено.');
    } catch (err) {
      console.error('Failed to RSVP event:', err);
      alert('Грешка при потвърждаване на участието');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ListHeader
        title="Последни Събития"
        description="Преглед на предстоящи и минали събития в общината. Създайте събитие или потвърдете участие."
        actionLabel="Създай събитие"
        actionHref="/events/new"
        icon={<Calendar className="h-8 w-8" />}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Offline Banner */}
        {isOffline && (
          <OfflineState 
            showCached={events.length > 0}
            onRetry={() => loadEvents()}
          />
        )}

        {/* Filters */}
        <div className="mb-6">
          <EventFiltersBar
            filters={filters}
            onChange={setFilters}
            resultCount={total}
          />
        </div>

        {/* Content */}
        {isLoading && events.length === 0 ? (
          <SkeletonGrid type="event" count={6} />
        ) : error ? (
          <ErrorState
            title="Грешка при зареждане"
            description={error.message || "Възникна грешка при зареждане на събитията"}
            onRetry={() => loadEvents()}
          />
        ) : events.length === 0 ? (
          <EmptyState
            type={filters.q || filters.category?.length || filters.when !== 'upcoming' ? 'filter' : 'event'}
            onClearFilters={() => setFilters({ sort: 'start_at', when: 'upcoming', limit: 20 })}
          />
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  position={index}
                  onRSVP={handleRSVP}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentCount={events.length}
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

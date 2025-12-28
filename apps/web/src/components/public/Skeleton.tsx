/**
 * Skeleton компоненти за loading състояния
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      role="status"
      aria-label="Зареждане..."
    />
  );
}

/**
 * Skeleton за карта на сигнал
 */
export function SignalCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="h-48 w-full rounded-none" />
      
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        
        {/* Address */}
        <Skeleton className="h-4 w-2/3" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton за карта на идея
 */
export function IdeaCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      {/* Title */}
      <Skeleton className="h-6 w-3/4" />
      
      {/* Summary */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Author & tags */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-4 pt-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

/**
 * Skeleton за карта на събитие
 */
export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Poster skeleton */}
      <Skeleton className="h-40 w-full rounded-none" />
      
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-6 w-4/5" />
        
        {/* Date & time */}
        <Skeleton className="h-4 w-3/4" />
        
        {/* Location */}
        <Skeleton className="h-4 w-2/3" />
        
        {/* Category & RSVPs */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton за филтърни чипове
 */
export function FilterChipsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full" />
      ))}
    </div>
  );
}

/**
 * Grid от skeleton карти
 */
interface SkeletonGridProps {
  type: 'signal' | 'idea' | 'event';
  count?: number;
}

export function SkeletonGrid({ type, count = 6 }: SkeletonGridProps) {
  const SkeletonCard = 
    type === 'signal' ? SignalCardSkeleton :
    type === 'idea' ? IdeaCardSkeleton :
    EventCardSkeleton;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

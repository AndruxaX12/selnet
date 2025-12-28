interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
  );
}

export function NotificationSkeleton() {
  return (
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function NotificationDropdownSkeleton() {
  return (
    <div className="absolute right-0 mt-3 w-96 max-w-[92vw] rounded-xl border border-gray-200 bg-white shadow-2xl z-50">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="w-4 h-4 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="max-h-96 overflow-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 text-right">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

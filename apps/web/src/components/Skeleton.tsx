export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="bg-gray-200 h-4 w-3/4 mb-2 rounded"></div>
      <div className="bg-gray-200 h-3 w-full mb-1 rounded"></div>
      <div className="bg-gray-200 h-3 w-2/3 rounded"></div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 h-3 rounded ${
            i === lines - 1 ? "w-2/3" : "w-full"
          }`}
        ></div>
      ))}
    </div>
  );
}

export function SkeletonButton() {
  return <div className="bg-gray-200 h-10 w-24 rounded animate-pulse"></div>;
}

export function SkeletonAvatar() {
  return <div className="bg-gray-200 h-10 w-10 rounded-full animate-pulse"></div>;
}

export function SkeletonImage() {
  return (
    <div className="bg-gray-200 h-32 w-full rounded animate-pulse"></div>
  );
}

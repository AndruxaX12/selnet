import { memo } from 'react';

interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
}

const SkeletonCard = memo(({ className = '', showImage = false }: SkeletonCardProps) => {
  return (
    <div className={`bg-white border rounded-lg p-4 animate-pulse ${className}`}>
      {showImage && (
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
      )}
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

export default SkeletonCard;

"use client";

export function FormSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Form Card Skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse"></div>
              </div>
            ))}
            
            {/* Upload Area Skeleton */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded mx-auto animate-pulse"></div>
                <div className="h-3 w-48 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
            </div>

            {/* Button Skeleton */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <div className="h-12 flex-1 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-12 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

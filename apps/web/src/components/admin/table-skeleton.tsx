export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="animate-pulse">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div 
                      className="h-4 bg-gray-200 rounded" 
                      style={{ width: `${60 + Math.random() * 40}%` }}
                    ></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-14 w-14 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-6 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

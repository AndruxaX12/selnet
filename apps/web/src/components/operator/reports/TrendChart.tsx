interface TrendDataPoint {
  date: string;
  new: number;
  confirmed: number;
  in_process: number;
  resolved: number;
}

interface Props {
  data: TrendDataPoint[];
}

export function TrendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Няма данни за показване</p>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.flatMap((d) => [d.new, d.confirmed, d.in_process, d.resolved])
  );
  const scale = 100 / (maxValue || 1);

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-700">Нови</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm text-gray-700">Потвърдени</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm text-gray-700">В процес</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Решени</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-80">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500">
          <span>{maxValue}</span>
          <span>{Math.floor(maxValue * 0.75)}</span>
          <span>{Math.floor(maxValue * 0.5)}</span>
          <span>{Math.floor(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full flex items-end gap-1">
          {data.map((point, idx) => {
            const newHeight = point.new * scale;
            const confirmedHeight = point.confirmed * scale;
            const processHeight = point.in_process * scale;
            const resolvedHeight = point.resolved * scale;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                {/* Bars */}
                <div className="w-full flex flex-col-reverse gap-0.5 pb-8">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600 cursor-pointer"
                    style={{ height: `${newHeight}%`, minHeight: "2px" }}
                    title={`Нови: ${point.new}`}
                  ></div>
                  <div
                    className="w-full bg-yellow-500 rounded-t transition-all hover:bg-yellow-600 cursor-pointer"
                    style={{ height: `${confirmedHeight}%`, minHeight: "2px" }}
                    title={`Потвърдени: ${point.confirmed}`}
                  ></div>
                  <div
                    className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600 cursor-pointer"
                    style={{ height: `${processHeight}%`, minHeight: "2px" }}
                    title={`В процес: ${point.in_process}`}
                  ></div>
                  <div
                    className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600 cursor-pointer"
                    style={{ height: `${resolvedHeight}%`, minHeight: "2px" }}
                    title={`Решени: ${point.resolved}`}
                  ></div>
                </div>

                {/* Date label */}
                <span className="absolute bottom-0 text-xs text-gray-500 rotate-45 origin-top-left whitespace-nowrap mt-2">
                  {new Date(point.date).toLocaleDateString("bg-BG", {
                    day: "numeric",
                    month: "short"
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Общо нови</p>
          <p className="text-2xl font-bold text-blue-600">
            {data.reduce((sum, d) => sum + d.new, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Общо потвърдени</p>
          <p className="text-2xl font-bold text-yellow-600">
            {data.reduce((sum, d) => sum + d.confirmed, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Общо в процес</p>
          <p className="text-2xl font-bold text-purple-600">
            {data.reduce((sum, d) => sum + d.in_process, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Общо решени</p>
          <p className="text-2xl font-bold text-green-600">
            {data.reduce((sum, d) => sum + d.resolved, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

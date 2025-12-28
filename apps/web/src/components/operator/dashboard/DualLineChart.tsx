interface DataPoint {
  date: string;
  new: number;
  processed: number;
}

interface Props {
  data: DataPoint[];
}

export function DualLineChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Няма данни за показване</p>
      </div>
    );
  }

  // Намерим максималната стойност за скалиране
  const maxValue = Math.max(...data.flatMap((d) => [d.new, d.processed]));
  const scale = 100 / (maxValue || 1);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-700">Нови</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Обработени</span>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="h-64 flex items-end gap-1">
        {data.map((point, idx) => {
          const newHeight = point.new * scale;
          const processedHeight = point.processed * scale;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5">
                <div
                  className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${newHeight}%`, minHeight: "2px" }}
                  title={`Нови: ${point.new}`}
                ></div>
                <div
                  className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-600"
                  style={{ height: `${processedHeight}%`, minHeight: "2px" }}
                  title={`Обработени: ${point.processed}`}
                ></div>
              </div>
              <span className="text-xs text-gray-500 mt-1">
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
  );
}

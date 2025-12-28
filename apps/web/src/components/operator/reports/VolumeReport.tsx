interface VolumeItem {
  id: string;
  name: string;
  count: number;
}

interface Props {
  data: VolumeItem[];
}

export function VolumeReport({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Няма данни за показване</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...data.map((item) => item.count));

  return (
    <div className="space-y-4">
      {data.map((item, idx) => {
        const percentage = total > 0 ? (item.count / total) * 100 : 0;
        const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

        return (
          <div key={item.id} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                  {idx + 1}
                </span>
                <span className="font-medium text-gray-900">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-900">{item.count}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 group-hover:from-primary-600 group-hover:to-primary-700"
                style={{ width: `${barWidth}%` }}
              ></div>
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700">Общо</span>
          <span className="text-2xl font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
}

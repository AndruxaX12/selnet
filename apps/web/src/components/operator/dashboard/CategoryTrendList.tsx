import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  count: number;
  pct: number;
  change: number;
}

interface Props {
  categories: Category[];
}

export function CategoryTrendList({ categories }: Props) {
  if (!categories || categories.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>Няма данни за категории</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{category.name}</h4>
              <span className="text-sm font-semibold text-gray-700">
                {category.count}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${category.pct}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{category.pct.toFixed(1)}%</span>
              
              {category.change !== 0 && (
                <span
                  className={`flex items-center text-xs font-medium ${
                    category.change > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {category.change > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(category.change)}
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/operator/inbox?category=${category.id}`}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Виж опашката"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ))}
    </div>
  );
}

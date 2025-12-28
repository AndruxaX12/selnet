import Link from "next/link";
import { Plus } from "lucide-react";

interface ListHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  showAction?: boolean;
  icon?: React.ReactNode;
}

/**
 * ListHeader - Заглавен компонент за публични страници
 */
export function ListHeader({
  title,
  description,
  actionLabel,
  actionHref,
  showAction = true,
  icon,
}: ListHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title & Description */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {icon && (
                <div className="flex-shrink-0 text-blue-600">
                  {icon}
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900">
                {title}
              </h1>
            </div>
            <p className="text-gray-600 max-w-3xl">
              {description}
            </p>
          </div>

          {/* Action Button */}
          {showAction && actionHref && actionLabel && (
            <div className="flex-shrink-0">
              <Link
                href={actionHref}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-sm hover:shadow-md"
              >
                <Plus className="h-5 w-5" />
                {actionLabel}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

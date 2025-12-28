"use client";
import { AlertCircle, Lightbulb, Calendar, Search, Filter } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  type: 'signal' | 'idea' | 'event' | 'search' | 'filter';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onClearFilters?: () => void;
}

/**
 * Empty State компонент
 */
export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onClearFilters,
}: EmptyStateProps) {
  const configs = {
    signal: {
      icon: AlertCircle,
      title: 'Няма намерени сигнали',
      description: 'Все още няма подадени сигнали или не отговарят на зададените филтри.',
      actionLabel: 'Подай сигнал',
      actionHref: '/signals/new',
      illustration: '🚨',
    },
    idea: {
      icon: Lightbulb,
      title: 'Няма намерени идеи',
      description: 'Все още няма споделени идеи или не отговарят на зададените филтри.',
      actionLabel: 'Сподели идея',
      actionHref: '/ideas/new',
      illustration: '💡',
    },
    event: {
      icon: Calendar,
      title: 'Няма намерени събития',
      description: 'Все още няма предстоящи събития или не отговарят на зададените филтри.',
      actionLabel: 'Създай събитие',
      actionHref: '/events/new',
      illustration: '📅',
    },
    search: {
      icon: Search,
      title: 'Няма резултати от търсенето',
      description: 'Опитайте с различни ключови думи или променете филтрите.',
      actionLabel: 'Изчисти търсенето',
      illustration: '🔍',
    },
    filter: {
      icon: Filter,
      title: 'Няма резултати',
      description: 'Няма елементи, които да отговарят на избраните филтри.',
      actionLabel: 'Изчисти филтрите',
      illustration: '🔍',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration */}
      <div className="mb-6 text-6xl opacity-50">
        {config.illustration}
      </div>

      {/* Icon */}
      <div className="mb-4 rounded-full bg-gray-100 p-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-xl font-semibold text-gray-900">
        {title || config.title}
      </h3>

      {/* Description */}
      <p className="mb-6 max-w-md text-sm text-gray-600">
        {description || config.description}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {(type === 'filter' || type === 'search') && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            {actionLabel || config.actionLabel}
          </button>
        )}

        {actionHref && type !== 'filter' && type !== 'search' && (
          <Link
            href={actionHref || config.actionHref}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            {actionLabel || config.actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Error State компонент
 */
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorState({
  title = 'Нещо се обърка',
  description = 'Възникна грешка при зареждане на данните. Моля, опитайте отново.',
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Error illustration */}
      <div className="mb-6 text-6xl">
        ⚠️
      </div>

      {/* Icon */}
      <div className="mb-4 rounded-full bg-red-100 p-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-xl font-semibold text-gray-900">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-6 max-w-md text-sm text-gray-600">
        {description}
      </p>

      {/* Retry button */}
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Опитай отново
        </button>
      )}
    </div>
  );
}

/**
 * Offline State компонент
 */
interface OfflineStateProps {
  showCached?: boolean;
  onRetry?: () => void;
}

export function OfflineState({ showCached = false, onRetry }: OfflineStateProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="rounded-full bg-amber-100 p-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900 mb-1">
            Офлайн режим
          </h4>
          <p className="text-sm text-amber-800">
            {showCached 
              ? 'Няма връзка с интернет. Показани са запазени данни.'
              : 'Няма връзка с интернет. Моля, проверете свързването си.'}
          </p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-amber-900 underline hover:no-underline"
            >
              Опитай отново
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

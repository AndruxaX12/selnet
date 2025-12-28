"use client";
import { Chip, ChipGroup } from "@/components/public/Chip";
import { SearchBar } from "@/components/public/SearchBar";
import { SortDropdown } from "@/components/public/SortDropdown";
import type { EventFilters, EventPeriod, EventCategory } from "@/types/events";
import { EVENT_PERIOD_LABELS, EVENT_CATEGORY_LABELS } from "@/types/events";

interface EventFiltersBarProps {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
  resultCount?: number;
}

const sortOptions = [
  { value: 'start_at', label: 'Предстоящи (най-скоро)' },
  { value: '-rsvp_count', label: 'Най-популярни (RSVP)' },
  { value: '-created_at', label: 'Най-ново добавени' },
];

/**
 * EventFiltersBar - Филтри за събития
 */
export function EventFiltersBar({ filters, onChange, resultCount }: EventFiltersBarProps) {
  const updateFilter = <K extends keyof EventFilters>(key: K, value: EventFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = <T,>(key: keyof EventFilters, value: T) => {
    const currentValues = (filters[key] as T[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    updateFilter(key, newValues as any);
  };

  const clearFilters = () => {
    onChange({
      sort: 'start_at',
      when: 'upcoming',
      limit: 20,
    });
  };

  const hasActiveFilters = 
    filters.when !== 'upcoming' ||
    filters.category?.length ||
    filters.online !== undefined ||
    filters.q;

  const periodOptions: EventPeriod[] = ['upcoming', 'today', 'weekend', 'month', 'past'];
  const categoryOptions: EventCategory[] = ['community', 'culture', 'sport', 'education', 'ecology', 'social', 'meeting'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={filters.q || ''}
            onChange={(value) => updateFilter('q', value || undefined)}
            placeholder="Търсене по заглавие, организатор, локация..."
          />
        </div>
        <SortDropdown
          options={sortOptions}
          value={filters.sort || 'start_at'}
          onChange={(value) => updateFilter('sort', value)}
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Period */}
        <ChipGroup label="Период">
          {periodOptions.map((period) => (
            <Chip
              key={period}
              label={EVENT_PERIOD_LABELS[period]}
              active={filters.when === period}
              onClick={() => updateFilter('when', period)}
              variant={period === 'upcoming' ? 'primary' : 'default'}
            />
          ))}
        </ChipGroup>

        {/* Category */}
        <ChipGroup label="Категория">
          {categoryOptions.map((category) => (
            <Chip
              key={category}
              label={EVENT_CATEGORY_LABELS[category]}
              active={filters.category?.includes(category)}
              onClick={() => toggleArrayFilter('category', category)}
            />
          ))}
        </ChipGroup>

        {/* Online/In-person */}
        <ChipGroup label="Формат">
          <Chip
            label="Онлайн"
            active={filters.online === true}
            onClick={() => updateFilter('online', filters.online === true ? undefined : true)}
            variant="success"
          />
          <Chip
            label="На място"
            active={filters.online === false}
            onClick={() => updateFilter('online', filters.online === false ? undefined : false)}
          />
        </ChipGroup>
      </div>

      {/* Clear Filters & Result Count */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-3 border-t">
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Изчисти филтрите
          </button>
          {resultCount !== undefined && (
            <span className="text-sm text-gray-600">
              {resultCount} резултата
            </span>
          )}
        </div>
      )}
    </div>
  );
}

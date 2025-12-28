"use client";
import { Chip, ChipGroup } from "@/components/public/Chip";
import { SearchBar } from "@/components/public/SearchBar";
import { SortDropdown } from "@/components/public/SortDropdown";
import type { IdeaFilters, IdeaStatus, IdeaCategory } from "@/types/ideas";
import { IDEA_STATUS_LABELS, IDEA_CATEGORY_LABELS } from "@/types/ideas";

interface IdeaFiltersBarProps {
  filters: IdeaFilters;
  onChange: (filters: IdeaFilters) => void;
  resultCount?: number;
}

const sortOptions = [
  { value: '-created_at', label: 'Най-нови' },
  { value: '-support_count', label: 'Най-подкрепяни' },
  { value: '-comments_count', label: 'Най-коментирани' },
];

/**
 * IdeaFiltersBar - Филтри за идеи
 */
export function IdeaFiltersBar({ filters, onChange, resultCount }: IdeaFiltersBarProps) {
  const updateFilter = <K extends keyof IdeaFilters>(key: K, value: IdeaFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = <T,>(key: keyof IdeaFilters, value: T) => {
    const currentValues = (filters[key] as T[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    updateFilter(key, newValues as any);
  };

  const clearFilters = () => {
    onChange({
      sort: '-created_at',
      limit: 20,
    });
  };

  const hasActiveFilters = 
    filters.status?.length ||
    filters.category?.length ||
    filters.tags?.length ||
    filters.openSupport ||
    filters.q;

  const statusOptions: IdeaStatus[] = ['novo', 'obsuzhdane', 'v_razrabotka', 'planirano'];
  const categoryOptions: IdeaCategory[] = ['transport', 'ecology', 'education', 'culture', 'sport', 'social', 'infrastructure'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={filters.q || ''}
            onChange={(value) => updateFilter('q', value || undefined)}
            placeholder="Търсене по заглавие, резюме, тагове..."
          />
        </div>
        <SortDropdown
          options={sortOptions}
          value={filters.sort || '-created_at'}
          onChange={(value) => updateFilter('sort', value)}
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status */}
        <ChipGroup label="Статус">
          {statusOptions.map((status) => (
            <Chip
              key={status}
              label={IDEA_STATUS_LABELS[status]}
              active={filters.status?.includes(status)}
              onClick={() => toggleArrayFilter('status', status)}
            />
          ))}
        </ChipGroup>

        {/* Category */}
        <ChipGroup label="Категория">
          {categoryOptions.map((category) => (
            <Chip
              key={category}
              label={IDEA_CATEGORY_LABELS[category]}
              active={filters.category?.includes(category)}
              onClick={() => toggleArrayFilter('category', category)}
            />
          ))}
        </ChipGroup>

        {/* Additional Filters */}
        <div className="flex flex-wrap gap-2">
          <Chip
            label="С отворена подкрепа"
            active={filters.openSupport === true}
            onClick={() => updateFilter('openSupport', filters.openSupport ? undefined : true)}
            variant="primary"
          />
        </div>
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

"use client";
import { Chip, ChipGroup } from "@/components/public/Chip";
import { SearchBar } from "@/components/public/SearchBar";
import { SortDropdown } from "@/components/public/SortDropdown";
import type { SignalFilters, SignalStatus, SignalCategory, SignalPriority } from "@/types/signals";
import {
  SIGNAL_STATUS_LABELS,
  SIGNAL_CATEGORY_LABELS,
  SIGNAL_PRIORITY_LABELS
} from "@/types/signals";
import { ALL_LOCATIONS } from "@/lib/constants/locations";

interface SignalFiltersBarProps {
  filters: SignalFilters;
  onChange: (filters: SignalFilters) => void;
  resultCount?: number;
}

const sortOptions = [
  { value: '-created_at', label: 'Най-нови' },
  { value: 'created_at', label: 'Най-стари' },
];

/**
 * SignalFiltersBar - Филтри за сигнали
 */
export function SignalFiltersBar({ filters, onChange, resultCount }: SignalFiltersBarProps) {
  const updateFilter = <K extends keyof SignalFilters>(key: K, value: SignalFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = <T,>(key: keyof SignalFilters, value: T) => {
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
      // Preserve mine filter if it exists
      ...(filters.mine ? { mine: true } : {}),
    });
  };

  const hasActiveFilters =
    filters.status?.length ||
    filters.category?.length ||
    filters.priority?.length ||
    filters.hasPhotos !== undefined ||
    filters.q;

  // Use actual status values from type definition
  const statusOptions: SignalStatus[] = ['novo', 'v_process', 'zavarsheno', 'othvarlen'];
  // Use actual category values from type definition (Bulgarian)
  const categoryOptions: SignalCategory[] = ['Пожар', 'ВиК', 'Ток', 'Пътища и тротоари', 'отпадъци', 'Осветление', 'Транспорт', 'Шум', 'Друго'];
  const priorityOptions: SignalPriority[] = ['urgent', 'high', 'normal', 'low'];

  const categoryDropdownOptions = [
    { value: "", label: "Всички категории" },
    ...categoryOptions.map(c => ({ value: c, label: SIGNAL_CATEGORY_LABELS[c] }))
  ];

  const settlementDropdownOptions = [
    { value: "", label: "Всички населени места" },
    ...ALL_LOCATIONS.map(l => ({ value: l.value, label: l.label }))
  ];

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 sm:p-6 space-y-4 w-full shadow-sm">

      {/* Search & Sort */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        <div className="flex-1 min-w-0">
          <div className="
            relative
            [&_input]:bg-white
            [&_input]:text-gray-900
            [&_input]:placeholder:text-gray-500
            [&_input]:border-gray-300
            [&_input:focus]:border-blue-500
            [&_input:focus]:ring-2
            [&_input:focus]:ring-blue-200
          ">
            <SearchBar
              value={filters.q || ''}
              onChange={(value) => updateFilter('q', value || undefined)}
              placeholder="Търсене по заглавие, описание, адрес..."
            />
          </div>
        </div>
        
        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap gap-2">
           <SortDropdown
            label="Населено място"
            options={settlementDropdownOptions}
            value={filters.district || ""}
            onChange={(val) => updateFilter('district', val || undefined)}
          />
          
          <SortDropdown
            label="Категория"
            options={categoryDropdownOptions}
            value={filters.category?.[0] || ""}
            onChange={(val) => updateFilter('category', val ? [val as SignalCategory] : undefined)}
          />

          <SortDropdown
            options={sortOptions}
            value={filters.sort || '-created_at'}
            onChange={(value) => updateFilter('sort', value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status */}
        <ChipGroup
          label="Статус"
          className="
          [&_span]:text-gray-700
          [&_button]:text-gray-800"
        >
          {statusOptions.map((status) => (
            <Chip
              key={status}
              label={SIGNAL_STATUS_LABELS[status]}
              active={filters.status?.includes(status)}
              onClick={() => toggleArrayFilter('status', status)}
            />
          ))}
        </ChipGroup>

        {/* Category - REMOVED (moved to dropdown) */}


        {/* Priority */}
        <ChipGroup label="Приоритет">
          {priorityOptions.map((priority) => (
            <Chip
              key={priority}
              label={SIGNAL_PRIORITY_LABELS[priority]}
              active={filters.priority?.includes(priority)}
              onClick={() => toggleArrayFilter('priority', priority)}
              variant={priority === 'urgent' ? 'danger' : priority === 'high' ? 'warning' : 'default'}
            />
          ))}
        </ChipGroup>

        {/* Additional Filters */}
        <div className="flex flex-wrap gap-2">
          <Chip
            label="Със снимки"
            active={filters.hasPhotos === true}
            onClick={() => updateFilter('hasPhotos', filters.hasPhotos ? undefined : true)}
          />
        </div>
      </div>

      {/* Clear Filters & Result Count */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 bg-gray-50 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-b-lg">
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

import { useState } from "react";
import { SignalFilters, SignalStatus, Priority } from "@/types/operator";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/operator/constants";
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  filters: SignalFilters;
  onChange: (filters: SignalFilters) => void;
}

export function FiltersSidebar({ filters, onChange }: Props) {
  const [expanded, setExpanded] = useState({
    status: true,
    priority: false,
    other: false
  });

  const toggleStatus = (status: SignalStatus) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onChange({ ...filters, status: updated.length > 0 ? updated : undefined });
  };

  const togglePriority = (priority: Priority) => {
    const current = filters.priority || [];
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    onChange({
      ...filters,
      priority: updated.length > 0 ? updated : undefined
    });
  };

  const clearAll = () => {
    onChange({});
  };

  const hasFilters =
    filters.status?.length ||
    filters.priority?.length ||
    filters.has_complaint ||
    filters.has_duplicate;

  return (
    <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Филтри</h2>
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Изчисти
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <button
          onClick={() => setExpanded((prev) => ({ ...prev, status: !prev.status }))}
          className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-gray-700"
        >
          Статус
          {expanded.status ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expanded.status && (
          <div className="space-y-2">
            {(["novo", "potvurden", "v_proces", "popraven", "otkhvurlen"] as SignalStatus[]).map(
              (status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status) || false}
                    onChange={() => toggleStatus(status)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {STATUS_LABELS[status]}
                </label>
              )
            )}
          </div>
        )}
      </div>

      {/* Priority Filter */}
      <div className="mb-6">
        <button
          onClick={() => setExpanded((prev) => ({ ...prev, priority: !prev.priority }))}
          className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-gray-700"
        >
          Приоритет
          {expanded.priority ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expanded.priority && (
          <div className="space-y-2">
            {(["urgent", "high", "normal", "low"] as Priority[]).map((priority) => (
              <label
                key={priority}
                className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.priority?.includes(priority) || false}
                  onChange={() => togglePriority(priority)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                {PRIORITY_LABELS[priority]}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Other Filters */}
      <div className="mb-6">
        <button
          onClick={() => setExpanded((prev) => ({ ...prev, other: !prev.other }))}
          className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-gray-700"
        >
          Други
          {expanded.other ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expanded.other && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={filters.has_complaint || false}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    has_complaint: e.target.checked || undefined
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Има жалба
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={filters.has_duplicate || false}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    has_duplicate: e.target.checked || undefined
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Има дубликати
            </label>
          </div>
        )}
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Активни филтри</h3>
          <div className="flex flex-wrap gap-2">
            {filters.status?.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
              >
                {STATUS_LABELS[status]}
                <button
                  onClick={() => toggleStatus(status)}
                  className="hover:text-primary-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.priority?.map((priority) => (
              <span
                key={priority}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
              >
                {PRIORITY_LABELS[priority]}
                <button
                  onClick={() => togglePriority(priority)}
                  className="hover:text-primary-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

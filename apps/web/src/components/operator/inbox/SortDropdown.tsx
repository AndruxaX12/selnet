import { SORT_OPTIONS } from "@/lib/operator/constants";
import { ArrowUpDown } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SortDropdown({ value, onChange }: Props) {
  const currentLabel =
    SORT_OPTIONS.find((opt) => opt.value === value)?.label || "Сортиране";

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
    </div>
  );
}

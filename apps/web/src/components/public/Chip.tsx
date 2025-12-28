"use client";
import { X } from "lucide-react";

interface ChipProps {
  label: string;
  active?: boolean;
  count?: number;
  onRemove?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

/**
 * Chip компонент за филтри
 */
export function Chip({
  label,
  active = false,
  count,
  onRemove,
  onClick,
  variant = 'default',
  size = 'md',
}: ChipProps) {
  const baseClasses = "inline-flex items-center gap-1.5 rounded-full font-medium transition-all";

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  const variantClasses = {
    default: active
      ? "bg-blue-100 text-blue-800 border-2 border-blue-600"
      : "bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    warning: "bg-amber-600 text-white hover:bg-amber-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const handleClick = () => {
    if (onClick && !onRemove) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${onClick && !onRemove ? 'cursor-pointer' : ''
        }`}
      type="button"
      aria-pressed={active}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`${active ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"} rounded-full px-1.5 py-0.5 text-xs font-semibold min-w-[20px] text-center`}>
          {count}
        </span>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5"
          aria-label={`Премахни филтър ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </button>
  );
}

/**
 * ChipGroup - група от чипове
 */
interface ChipGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function ChipGroup({ children, label }: ChipGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

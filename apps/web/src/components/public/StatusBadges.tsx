import type { SignalStatus, SignalPriority } from '@/types/signals';
import type { IdeaStatus } from '@/types/ideas';
import { 
  SIGNAL_STATUS_LABELS, 
  SIGNAL_STATUS_COLORS,
  SIGNAL_PRIORITY_LABELS 
} from '@/types/signals';
import { IDEA_STATUS_LABELS, IDEA_STATUS_COLORS } from '@/types/ideas';
import { AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: SignalStatus | IdeaStatus;
  type: 'signal' | 'idea';
}

/**
 * Status Badge за сигнали и идеи
 */
export function StatusBadge({ status, type }: StatusBadgeProps) {
  const labels = type === 'signal' ? SIGNAL_STATUS_LABELS : IDEA_STATUS_LABELS;
  const colors = type === 'signal' ? SIGNAL_STATUS_COLORS : IDEA_STATUS_COLORS;

  const label = labels[status as keyof typeof labels] || status;
  const colorClasses = colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses}`}
      role="status"
    >
      {label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: SignalPriority;
}

/**
 * Priority Badge за сигнали
 */
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const label = SIGNAL_PRIORITY_LABELS[priority];
  
  const config = {
    low: {
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      icon: false,
    },
    normal: {
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      icon: false,
    },
    high: {
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      icon: true,
    },
    urgent: {
      color: 'text-red-600',
      bg: 'bg-red-100',
      icon: true,
    },
  };

  const { color, bg, icon } = config[priority];

  if (priority === 'low' || priority === 'normal') {
    // Не показвай бейдж за нисък/нормален приоритет
    return null;
  }

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-1 rounded ${bg} ${color} text-xs font-semibold`}
      role="status"
      aria-label={`Приоритет: ${label}`}
    >
      {icon && <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  );
}

interface SLABadgeProps {
  label: string;
  variant: 'success' | 'warning' | 'danger';
  tooltip?: string;
}

/**
 * SLA Badge за сигнали
 */
export function SLABadge({ label, variant, tooltip }: SLABadgeProps) {
  if (!label) return null;

  const variantClasses = {
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-300',
    danger: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded border text-xs font-semibold ${variantClasses[variant]}`}
      role="status"
      title={tooltip}
    >
      {label}
    </span>
  );
}

interface CategoryBadgeProps {
  label: string;
  variant?: 'default' | 'primary';
}

/**
 * Category Badge
 */
export function CategoryBadge({ label, variant = 'default' }: CategoryBadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border-gray-300',
    primary: 'bg-blue-100 text-blue-700 border-blue-300',
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}

interface TagBadgeProps {
  label: string;
}

/**
 * Tag Badge за идеи
 */
export function TagBadge({ label }: TagBadgeProps) {
  return (
    <span 
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300"
    >
      #{label}
    </span>
  );
}

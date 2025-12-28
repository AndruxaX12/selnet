import { Shield } from "lucide-react";
import { ROLES } from "@/lib/rbac/roles";

interface RoleBadgeProps {
  role: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const ROLE_CONFIGS = {
  [ROLES.ADMIN]: {
    label: "Администратор",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  [ROLES.ADMINISTRATOR]: {
    label: "Администратор",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  MODERATOR: {
    label: "Модератор",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  [ROLES.USER]: {
    label: "Потребител",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

const SIZE_CLASSES = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5",
};

const ICON_SIZES = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export default function RoleBadge({ role, showIcon = true, size = "md" }: RoleBadgeProps) {
  const config = (ROLE_CONFIGS as Record<string, { label: string; color: string }>)[role] || ROLE_CONFIGS[ROLES.USER];
  const sizeClass = SIZE_CLASSES[size];
  const iconSize = ICON_SIZES[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold border ${config.color} ${sizeClass}`}
    >
      {showIcon && <Shield className={iconSize} />}
      {config.label}
    </span>
  );
}

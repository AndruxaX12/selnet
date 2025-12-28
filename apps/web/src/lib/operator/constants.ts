import { SignalStatus, Priority, SLAStatus } from "@/types/operator";

// Статусни лейбъли на български
export const STATUS_LABELS: Record<SignalStatus, string> = {
  novo: "Ново",
  potvurden: "Потвърден",
  v_proces: "В процес",
  popraven: "Поправен",
  arhiv: "Архив",
  otkhvurlen: "Отклонен"
};

// Цветове за статусите
export const STATUS_COLORS: Record<SignalStatus, string> = {
  novo: "bg-blue-100 text-blue-800 border-blue-200",
  potvurden: "bg-yellow-100 text-yellow-800 border-yellow-200",
  v_proces: "bg-purple-100 text-purple-800 border-purple-200",
  popraven: "bg-green-100 text-green-800 border-green-200",
  arhiv: "bg-gray-100 text-gray-800 border-gray-200",
  otkhvurlen: "bg-red-100 text-red-800 border-red-200"
};

// Приоритети
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Нисък",
  normal: "Нормален",
  high: "Висок",
  urgent: "Спешен"
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "text-gray-500",
  normal: "text-blue-500",
  high: "text-orange-500",
  urgent: "text-red-500"
};

// SLA статуси
export const SLA_COLORS: Record<SLAStatus, string> = {
  ok: "bg-green-100 text-green-800 border-green-300",
  warning: "bg-amber-100 text-amber-800 border-amber-300",
  overdue: "bg-red-100 text-red-800 border-red-300"
};

// SLA лимити (часове)
export const SLA_TTA_HOURS = 48;
export const SLA_PROCESS_DAYS = 5;
export const SLA_TTR_MEDIAN_DAYS = 14;

// Разрешени статусни преходи
export const STATUS_TRANSITIONS: Record<SignalStatus, SignalStatus[]> = {
  novo: ["potvurden", "otkhvurlen"],
  potvurden: ["v_proces", "otkhvurlen"],
  v_proces: ["popraven", "otkhvurlen"],
  popraven: ["arhiv", "v_proces"], // може да се върне в процес
  arhiv: [],
  otkhvurlen: []
};

// Опции за сортиране
export const SORT_OPTIONS = [
  { value: "sla_urgent", label: "Най-спешни по SLA" },
  { value: "oldest", label: "Най-стари" },
  { value: "newest", label: "Най-нови" },
  { value: "priority", label: "По приоритет" },
  { value: "nearest", label: "Най-близо до мен" }
];

// Inbox табове
export const INBOX_TABS = [
  { id: "novo", label: "Нови", filter: { status: ["novo"] } },
  { id: "for_confirmation", label: "За потвърждение", filter: { status: ["novo"] } },
  { id: "in_process", label: "В процес", filter: { status: ["v_proces"] } },
  { id: "overdue", label: "Просрочени", filter: {} },
  { id: "escalations", label: "Ескалации/Жалби", filter: { has_complaint: true } },
  { id: "assigned_to_me", label: "Зададени на мен", filter: {} }
] as const;

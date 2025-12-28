export type RecordType = "signals" | "ideas" | "events";
export type ModerationStatus = "new" | "triaged" | "in_progress" | "resolved" | "rejected" | "archived";

export const STATUS_LABEL: Record<ModerationStatus, string> = {
  new: "Ново",
  triaged: "Оценено",
  in_progress: "В процес",
  resolved: "Решено",
  rejected: "Отхвърлено",
  archived: "Архив"
};

export const STATUS_ORDER: ModerationStatus[] = ["new", "triaged", "in_progress", "resolved", "rejected", "archived"];

export const SLA_HOURS: Partial<Record<RecordType, number>> = {
  signals: 48,
  ideas: 72,
  events: 24
};

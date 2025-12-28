import { SLAStatus } from "@/types/operator";
import { SLA_TTA_HOURS, SLA_PROCESS_DAYS } from "./constants";

/**
 * Изчислява SLA статус и оставащо време
 */
export function calculateSLAStatus(
  deadlineISO: string | undefined,
  nowISO: string = new Date().toISOString()
): { status: SLAStatus; remaining: number; text: string } {
  if (!deadlineISO) {
    return { status: "ok", remaining: 0, text: "N/A" };
  }

  const deadline = new Date(deadlineISO).getTime();
  const now = new Date(nowISO).getTime();
  const diff = deadline - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (diff < 0) {
    const overdueHours = Math.abs(hours);
    return {
      status: "overdue",
      remaining: diff,
      text: `Просрочено ${overdueHours}ч`
    };
  }

  if (hours <= 12) {
    return {
      status: "warning",
      remaining: diff,
      text: `Остава ${hours}ч`
    };
  }

  return {
    status: "ok",
    remaining: diff,
    text: `Остава ${hours}ч`
  };
}

/**
 * Изчислява TTA deadline (48ч от създаване)
 */
export function calculateTTADeadline(createdAt: string): string {
  const created = new Date(createdAt);
  created.setHours(created.getHours() + SLA_TTA_HOURS);
  return created.toISOString();
}

/**
 * Изчислява Process deadline (5 дни от потвърждение)
 */
export function calculateProcessDeadline(confirmedAt: string): string {
  const confirmed = new Date(confirmedAt);
  confirmed.setDate(confirmed.getDate() + SLA_PROCESS_DAYS);
  return confirmed.toISOString();
}

/**
 * Форматира относително време на български
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Току-що";
  if (minutes < 60) return `Преди ${minutes} мин`;
  if (hours < 24) return `Преди ${hours} час${hours > 1 ? "а" : ""}`;
  if (days < 7) return `Преди ${days} ден${days > 1 ? "я" : ""}`;
  
  // Formatирай като DD.MM.YYYY
  return date.toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

/**
 * Форматира дата и час на български
 */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Форматира само дата
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

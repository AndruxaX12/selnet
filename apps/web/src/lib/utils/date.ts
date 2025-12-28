// Дати и време - Europe/Sofia, формат DD.MM.YYYY, HH:mm

const TIMEZONE = 'Europe/Sofia';
const LOCALE = 'bg-BG';

/**
 * Форматиране на дата: DD.MM.YYYY
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIMEZONE,
  }).format(d);
}

/**
 * Форматиране на време: HH:mm
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(d);
}

/**
 * Форматиране на дата и време: DD.MM.YYYY, HH:mm
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)}, ${formatTime(date)}`;
}

/**
 * Релативно време (преди 2 часа, преди 3 дни и т.н.)
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'Преди малко';
  if (diffMin < 60) return `Преди ${diffMin} ${diffMin === 1 ? 'минута' : 'минути'}`;
  if (diffHour < 24) return `Преди ${diffHour} ${diffHour === 1 ? 'час' : 'часа'}`;
  if (diffDay < 7) return `Преди ${diffDay} ${diffDay === 1 ? 'ден' : 'дни'}`;
  if (diffWeek < 4) return `Преди ${diffWeek} ${diffWeek === 1 ? 'седмица' : 'седмици'}`;
  if (diffMonth < 12) return `Преди ${diffMonth} ${diffMonth === 1 ? 'месец' : 'месеца'}`;
  return `Преди ${diffYear} ${diffYear === 1 ? 'година' : 'години'}`;
}

/**
 * Форматиране на период (за събития): 26.10.2025, 09:00 - 12:00
 */
export function formatEventPeriod(startAt: string | Date, endAt: string | Date): string {
  const start = typeof startAt === 'string' ? new Date(startAt) : startAt;
  const end = typeof endAt === 'string' ? new Date(endAt) : endAt;

  const startDate = formatDate(start);
  const startTime = formatTime(start);
  const endTime = formatTime(end);

  // Ако са в един ден
  if (formatDate(start) === formatDate(end)) {
    return `${startDate}, ${startTime} - ${endTime}`;
  }

  // Ако са в различни дни
  return `${startDate}, ${startTime} - ${formatDate(end)}, ${endTime}`;
}

/**
 * Проверка дали събитието е днес
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return formatDate(d) === formatDate(today);
}

/**
 * Проверка дали събитието е този уикенд (събота/неделя)
 */
export function isThisWeekend(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Намери следващата събота
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + daysUntilSaturday);
  nextSaturday.setHours(0, 0, 0, 0);

  const nextSunday = new Date(nextSaturday);
  nextSunday.setDate(nextSaturday.getDate() + 1);
  nextSunday.setHours(23, 59, 59, 999);

  return d >= nextSaturday && d <= nextSunday;
}

/**
 * Проверка дали събитието е този месец
 */
export function isThisMonth(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/**
 * Проверка дали датата е в миналото
 */
export function isPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Изчисляване на SLA статус (за сигнали)
 */
export function calculateSLAStatus(
  createdAt: string | Date,
  status: string,
  ttaHours: number | null
): {
  label: string;
  variant: 'success' | 'warning' | 'danger';
  overdue: boolean;
} {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  const hoursPassed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  // Ако е вече потвърден, няма SLA за потвърждение
  if (status !== 'novo') {
    return { label: '', variant: 'success', overdue: false };
  }

  const hoursRemaining = 48 - hoursPassed;

  if (hoursRemaining < 0) {
    return {
      label: `Просрочено ${Math.abs(Math.floor(hoursRemaining))}ч`,
      variant: 'danger',
      overdue: true,
    };
  }

  if (hoursRemaining < 12) {
    return {
      label: `Потвърди до ${Math.floor(hoursRemaining)}ч`,
      variant: 'warning',
      overdue: false,
    };
  }

  return {
    label: `Потвърди до ${Math.floor(hoursRemaining)}ч`,
    variant: 'success',
    overdue: false,
  };
}

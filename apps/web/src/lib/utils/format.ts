// Форматиране на текст, числа и други

/**
 * Truncate текст до определен брой редове
 */
export function truncateText(text: string, lines: number): string {
  if (!text) return '';
  
  // Приблизително 80 символа на ред
  const charsPerLine = 80;
  const maxLength = lines * charsPerLine;
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Truncate заглавие до определен брой символи
 */
export function truncateTitle(text: string, maxLength: number = 80): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  // Намери последната дума преди maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated.trim() + '...';
}

/**
 * Форматиране на число (1234 → 1 234)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('bg-BG').format(num);
}

/**
 * Компактно форматиране на голям номер (1500 → 1.5К)
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) return String(num);
  if (num < 1000000) return `${(num / 1000).toFixed(1).replace('.0', '')}К`;
  return `${(num / 1000000).toFixed(1).replace('.0', '')}М`;
}

/**
 * Pluralize (1 коментар, 2 коментара, 5 коментари)
 */
export function pluralize(count: number, singular: string, plural: string, pluralMany?: string): string {
  if (count === 1) return `${count} ${singular}`;
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return `${count} ${plural}`;
  }
  return `${count} ${pluralMany || plural}`;
}

/**
 * Форматиране на разстояние (в метри или километри)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }
  return `${(meters / 1000).toFixed(1)} км`;
}

/**
 * Генериране на share URL
 */
export function getShareUrl(type: 'signal' | 'idea' | 'event', id: string): string {
  if (typeof window === 'undefined') return '';
  return `/${type}s/${id}`;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    // Fallback за стари браузъри
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Генериране на инициали от име
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Slugify текст (Неизправно осветление → neizpravno-osvetlenie)
 */
export function slugify(text: string): string {
  const cyrillicToLatin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
    'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y',
    'ю': 'yu', 'я': 'ya'
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => cyrillicToLatin[char] || char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

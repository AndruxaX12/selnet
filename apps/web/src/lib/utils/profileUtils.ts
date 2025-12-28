/**
 * Profile & Settings Utility Functions
 * Common helpers for profile and settings operations
 */

import { ROLES } from "@/lib/rbac/roles";

/**
 * Get user's initials from name
 */
export function getUserInitials(name: string): string {
  if (!name) return "?";
  
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "Не е посочен";
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // Format Bulgarian phone numbers
  if (digits.startsWith("359")) {
    // +359 XXX XXX XXX
    return `+359 ${digits.substring(3, 6)} ${digits.substring(6, 9)} ${digits.substring(9)}`;
  } else if (digits.startsWith("0")) {
    // 0XXX XXX XXX
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  }
  
  return phone;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return true; // Optional field
  
  // Bulgarian phone numbers: +359XXXXXXXXX or 0XXXXXXXXX
  const phoneRegex = /^(\+359|0)[0-9]{9}$/;
  const digits = phone.replace(/\D/g, "");
  
  return phoneRegex.test(digits) || digits.length === 9;
}

/**
 * Check if password meets requirements
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push("Паролата трябва да бъде поне 6 символа");
  }
  
  if (password.length > 128) {
    errors.push("Паролата е твърде дългa (макс. 128 символа)");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate image file for upload
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Моля изберете JPG, PNG или GIF файл",
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Файлът е твърде голям (${(file.size / 1024 / 1024).toFixed(2)} MB). Максимум: 5MB`,
    };
  }
  
  return { valid: true };
}

/**
 * Convert File to Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get role display name in Bulgarian
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    [ROLES.ADMIN]: "Главен администратор",
    [ROLES.ADMINISTRATOR]: "Администратор",
    MODERATOR: "Модератор",
    [ROLES.USER]: "Потребител",
  };
  
  return roleNames[role] || "Потребител";
}

/**
 * Check if user can delete their account
 */
export function canDeleteAccount(role: string): boolean {
  return role === ROLES.USER;
}

/**
 * Check if user has admin access
 */
export function isAdmin(role: string): boolean {
  return role === ROLES.ADMIN || role === ROLES.ADMINISTRATOR;
}

/**
 * Check if user has moderator access
 */
export function isModerator(role: string): boolean {
  return role === ROLES.ADMIN || role === ROLES.ADMINISTRATOR || role === "MODERATOR";
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | any): string {
  if (!date) return "Неизвестна";
  
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === "string") {
    dateObj = new Date(date);
  } else if (date.toDate && typeof date.toDate === "function") {
    // Firestore Timestamp
    dateObj = date.toDate();
  } else if (date._seconds) {
    // Firestore Timestamp object
    dateObj = new Date(date._seconds * 1000);
  } else {
    return "Неизвестна";
  }
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Днес";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `Преди ${diffDays} дни`;
  if (diffDays < 30) return `Преди ${Math.floor(diffDays / 7)} седмици`;
  if (diffDays < 365) return `Преди ${Math.floor(diffDays / 30)} месеца`;
  
  return `Преди ${Math.floor(diffDays / 365)} години`;
}

/**
 * Format member since date
 */
export function formatMemberSince(date: Date | string | any): string {
  if (!date) return "Неизвестна";
  
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === "string") {
    dateObj = new Date(date);
  } else if (date.toDate && typeof date.toDate === "function") {
    dateObj = date.toDate();
  } else if (date._seconds) {
    dateObj = new Date(date._seconds * 1000);
  } else {
    return "Неизвестна";
  }
  
  const months = [
    "януари", "февруари", "март", "април", "май", "юни",
    "юли", "август", "септември", "октомври", "ноември", "декември"
  ];
  
  return `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

/**
 * Get location display string
 */
export function getLocationString(city?: string, street?: string): string {
  if (!city && !street) return "Не е посочена";
  if (!street) return city || "Не е посочена";
  return `${city}, ${street}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Get avatar background color based on name
 */
export function getAvatarColor(name: string): string {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  
  if (!name) return colors[0];
  
  const charCode = name.charCodeAt(0);
  return colors[charCode % colors.length];
}

/**
 * Check if string is a valid city from the locations list
 */
export function isValidCity(city: string): boolean {
  const validCities = [
    "Ботевград",
    "Врачеш",
    "Трудовец",
    "Боженица",
    "Скравена",
    "Литаково",
  ];
  
  return validCities.includes(city);
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 500); // Limit length
}

/**
 * Generate a random avatar URL from DiceBear API
 */
export function getRandomAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Check if notification permission is granted
 */
export function hasNotificationPermission(): boolean {
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
}

/**
 * Get notification permission status text
 */
export function getNotificationPermissionText(): string {
  if (!("Notification" in window)) {
    return "Браузърът не поддържа известия";
  }
  
  switch (Notification.permission) {
    case "granted":
      return "Известията са разрешени";
    case "denied":
      return "Известията са блокирани";
    default:
      return "Известията не са конфигурирани";
  }
}

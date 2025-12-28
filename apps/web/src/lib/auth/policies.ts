// RBAC Policy Map — action:resource → allowed roles
export type RoleKey = "USER" | "OPERATOR" | "ADMIN" | "GUEST";

export const POLICIES = {
  // Четене
  "read:list": ["GUEST", "USER", "OPERATOR", "ADMIN"],
  "read:signal": ["GUEST", "USER", "OPERATOR", "ADMIN"],
  "read:event": ["GUEST", "USER", "OPERATOR", "ADMIN"],
  "read:ideas_all": ["ADMIN"],
  "read:reports": ["ADMIN"],
  "read:analytics": ["ADMIN"],

  // Създаване
  "create:signal": ["USER", "OPERATOR", "ADMIN"],
  "create:event": ["OPERATOR", "ADMIN"],
  "create:comment": ["OPERATOR", "ADMIN"],
  "create:user": ["ADMIN"],

  // Редакция на собствени
  "update:own": ["USER", "OPERATOR", "ADMIN"],
  "delete:own": ["USER", "OPERATOR", "ADMIN"],

  // Оператор
  "signal:verify": ["OPERATOR", "ADMIN"],
  "signal:transition": ["OPERATOR", "ADMIN"],
  "operator:dashboard": ["OPERATOR", "ADMIN"],

  // Администрация
  "admin:users": ["ADMIN"],
  "admin:roles": ["ADMIN"],
  "admin:system": ["ADMIN"],
  "update:event": ["ADMIN"],
  "delete:event": ["ADMIN"],
  "delete:signal": ["ADMIN"],
  "verify:user": ["ADMIN"],
  "block:user": ["ADMIN"],
  "delete:user": ["ADMIN"],
  "promote:user": ["ADMIN"],
  "demote:user": ["ADMIN"],
} as const;

export type PolicyAction = keyof typeof POLICIES;

export function can(userRoles: RoleKey[] | RoleKey | null | undefined, action: PolicyAction): boolean {
  // ФИКС: Променено от "guest" на "GUEST"
  if (!userRoles) return (POLICIES[action] as readonly string[])?.includes("GUEST") ?? false;

  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  const allowedRoles = POLICIES[action] as readonly string[];

  if (!allowedRoles) return false;

  return roles.some(role => allowedRoles.includes(role));
}

export function hasAnyRole(userRoles: RoleKey[] | RoleKey | null | undefined, requiredRoles: RoleKey[]): boolean {
  // ФИКС: Променено от "guest" на "GUEST"
  if (!userRoles) return requiredRoles.includes("GUEST");

  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  return roles.some(role => requiredRoles.includes(role));
}

export function hasAllRoles(userRoles: RoleKey[] | RoleKey | null | undefined, requiredRoles: RoleKey[]): boolean {
  if (!userRoles) return false;

  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  return requiredRoles.every(reqRole => roles.includes(reqRole));
}

export function getHighestRole(userRoles: RoleKey[] | RoleKey | null | undefined): RoleKey {
  // ФИКС: Променено от "guest" на "GUEST"
  if (!userRoles) return "GUEST";

  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  const priority: Record<RoleKey, number> = {
    ADMIN: 100,
    OPERATOR: 70,
    USER: 50,
    GUEST: 0,
  };

  let highest: RoleKey = "GUEST";
  let highestPriority = 0;

  for (const role of roles) {
    const p = priority[role as RoleKey] ?? 0;
    if (p > highestPriority) {
      highest = role as RoleKey;
      highestPriority = p;
    }
  }

  return highest;
}

export const ROLE_NAMES: Record<RoleKey, string> = {
  GUEST: "Гост",
  USER: "Гражданин",
  OPERATOR: "Оператор (общински служител)",
  ADMIN: "Администратор",
};

export const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  GUEST: "Преглежда публични списъци, няма права за действия",
  USER: "Създава сигнали, идеи, събития, подкрепя и коментира",
  OPERATOR: "Обработва сигнали, променя статуси и координира със служби",
  ADMIN: "Пълен контрол над системата и потребителите",
};

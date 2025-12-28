// 1. Уеднаквяваме ключовете с главни букви, както е в основната логика
export type RoleKey = "USER" | "OPERATOR" | "ADMIN";

export const ROLE_LABELS: Record<RoleKey, string> = {
  USER: "Потребител",
  OPERATOR: "Оператор (Общински служител)",
  ADMIN: "Администратор"
};

// 2. Подреждаме ги по тежест (йерархия)
export const ROLE_ORDER: RoleKey[] = ["USER", "OPERATOR", "ADMIN"];

export type Role = RoleKey;

// 3. Дефинираме кои роли имат достъп до модерация/панели
export const MOD_ROLES: Role[] = ["OPERATOR", "ADMIN"];

export const canModerate = (role?: string | null) => 
  !!role && MOD_ROLES.includes(role as Role);

// Scopes остават същите, те са полезни за ограничаване на операторите по райони
export type Scopes = {
  settlements?: string[]; 
  municipalities?: string[];
  provinces?: string[];
};
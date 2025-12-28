// Server-side RBAC utilities
import { redirect } from "next/navigation";
import { getSessionUser } from "./server-session";
import { can, hasAnyRole, PolicyAction, RoleKey } from "./policies";
import type { SessionUser } from "@/types/auth";
import { ROLES } from "@/lib/rbac/roles";

// Server-side guard: изисква authentication
export async function requireAuth(opts?: { redirectTo?: string }): Promise<SessionUser> {
  const user = await getSessionUser();
  
  if (!user) {
    redirect(opts?.redirectTo ?? "/login?reason=auth_required");
  }
  
  return user;
}

// Server-side guard: изисква конкретна роля
export async function requireRole(
  allowed: RoleKey[], 
  opts?: { redirectTo?: string }
): Promise<SessionUser> {
  const user = await requireAuth(opts);
  
  if (!user.role || !allowed.includes(user.role as RoleKey)) {
    redirect(opts?.redirectTo ?? "/403");
  }
  
  return user;
}

// Server-side guard: изисква конкретен action permission
export async function requirePermission(
  action: PolicyAction,
  opts?: { redirectTo?: string }
): Promise<SessionUser> {
  const user = await requireAuth(opts);
  
  const userRole = user.role as RoleKey | null;
  if (!can(userRole, action)) {
    redirect(opts?.redirectTo ?? "/403");
  }
  
  return user;
}

// API guard: проверка на роля в API routes
export async function apiRequireRole(allowed: RoleKey[]): Promise<SessionUser> {
  const user = await getSessionUser();
  
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  
  if (!user.role || !allowed.includes(user.role as RoleKey)) {
    throw new Error("FORBIDDEN");
  }
  
  return user;
}

// API guard: проверка на permission в API routes
export async function apiRequirePermission(action: PolicyAction): Promise<SessionUser> {
  const user = await getSessionUser();
  
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  
  const userRole = user.role as RoleKey | null;
  if (!can(userRole, action)) {
    throw new Error("FORBIDDEN");
  }
  
  return user;
}

// Helper: проверка дали потребителят е собственик на ресурса
export function isOwner(user: SessionUser | null, resourceOwnerId: string): boolean {
  return user?.uid === resourceOwnerId;
}

// Helper: проверка дали може да редактира (собственик или admin/operator)
export function canEdit(user: SessionUser | null, resourceOwnerId: string): boolean {
  if (!user) return false;
  if (isOwner(user, resourceOwnerId)) return true;
  
  const role = user.role as string;
  // Проверяваме с големи букви, както е в новата ти структура
  return role === ROLES.ADMIN || role === ROLES.OPERATOR;
}

// Helper: проверка дали може да изтрие
// Helper: проверка дали може да изтрие
export function canDelete(user: SessionUser | null, resourceOwnerId: string): boolean {
  if (!user) return false;
  
  // 1. Собственик може да изтрие своето, ако има такова право в policies
  if (isOwner(user, resourceOwnerId)) {
    const role = user.role as RoleKey;
    return can(role, "delete:own");
  }
  
  // 2. Проверка за административни роли (използваме ROLES константата)
  const role = user.role as string;
  return role === ROLES.ADMIN; 
}
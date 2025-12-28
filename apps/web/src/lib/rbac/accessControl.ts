// apps/web/src/lib/rbac/accessControl.ts
type User = {
  roles: string[];
  [key: string]: any;
};

export const hasRole = (user: User | null, requiredRole: string): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.includes(requiredRole);
};

export const hasAnyRole = (user: User | null, ...roles: string[]): boolean => {
  if (!user || !user.roles) return false;
  return roles.some(role => user.roles.includes(role));
};

export const hasAllRoles = (user: User | null, ...roles: string[]): boolean => {
  if (!user || !user.roles) return false;
  return roles.every(role => user.roles.includes(role));
};
// === ROLE DEFINITIONS ===
export const ROLES = {
  ADMIN: 'ADMIN',      // Пълен контрол
  OPERATOR: 'OPERATOR', // Твоята нова роля за оператори (заменя администратор)
  USER: 'USER',        // Потребител
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// === ROLE LABELS (Bulgarian) ===
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Админ',
  OPERATOR: 'Администратор',
  USER: 'Потребител',
};

// === ROLE DESCRIPTIONS ===
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Пълен контрол над системата, управление на потребители и роли',
  OPERATOR: 'Управление на сигнали, модерация на съдържание, блокиране на потребители',
  USER: 'Създаване и управление на собствени сигнали',
};

// === ROLE HIERARCHY ===
// Higher number = higher privileges
export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 3,
  OPERATOR: 2,
  USER: 1,
};

// === ROLE PERMISSIONS ===
export const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_SYSTEM: 'manage_system',
  VIEW_LOGS: 'view_logs',
  DELETE_ANY: 'delete_any',
  
  // Operator permissions
  MODERATE_SIGNALS: 'moderate_signals',
  EDIT_ANY_SIGNAL: 'edit_any_signal',
  DELETE_SIGNAL: 'delete_signal',
  ARCHIVE_SIGNAL: 'archive_signal',
  SET_SIGNAL_STATUS: 'set_signal_status',
  ADD_ADMIN_COMMENT: 'add_admin_comment',
  BLOCK_USER: 'block_user',
  VIEW_ALL_USERS: 'view_all_users',
  
  // User permissions
  CREATE_SIGNAL: 'create_signal',
  EDIT_OWN_SIGNAL: 'edit_own_signal',
  DELETE_OWN_SIGNAL: 'delete_own_signal',
  VIEW_OWN_SIGNALS: 'view_own_signals',
  COMMENT: 'comment',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// === ROLE PERMISSIONS MAP ===
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    // Admin has ALL permissions
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.DELETE_ANY,
    PERMISSIONS.MODERATE_SIGNALS,
    PERMISSIONS.EDIT_ANY_SIGNAL,
    PERMISSIONS.DELETE_SIGNAL,
    PERMISSIONS.ARCHIVE_SIGNAL,
    PERMISSIONS.SET_SIGNAL_STATUS,
    PERMISSIONS.ADD_ADMIN_COMMENT,
    PERMISSIONS.BLOCK_USER,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.CREATE_SIGNAL,
    PERMISSIONS.EDIT_OWN_SIGNAL,
    PERMISSIONS.DELETE_OWN_SIGNAL,
    PERMISSIONS.VIEW_OWN_SIGNALS,
    PERMISSIONS.COMMENT,
  ],
  
  OPERATOR: [
    // Administrator has moderation permissions
    PERMISSIONS.MODERATE_SIGNALS,
    PERMISSIONS.EDIT_ANY_SIGNAL,
    PERMISSIONS.DELETE_SIGNAL,
    PERMISSIONS.ARCHIVE_SIGNAL,
    PERMISSIONS.SET_SIGNAL_STATUS,
    PERMISSIONS.ADD_ADMIN_COMMENT,
    PERMISSIONS.BLOCK_USER,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.CREATE_SIGNAL,
    PERMISSIONS.EDIT_OWN_SIGNAL,
    PERMISSIONS.DELETE_OWN_SIGNAL,
    PERMISSIONS.VIEW_OWN_SIGNALS,
    PERMISSIONS.COMMENT,
  ],
  
  USER: [
    // User has basic permissions
    PERMISSIONS.CREATE_SIGNAL,
    PERMISSIONS.EDIT_OWN_SIGNAL,
    PERMISSIONS.DELETE_OWN_SIGNAL,
    PERMISSIONS.VIEW_OWN_SIGNALS,
    PERMISSIONS.COMMENT,
  ],
};

// === HELPER FUNCTIONS ===

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if a role is higher or equal to another role
 */
export function isRoleHigherOrEqual(role: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Check if a role can manage another role
 * Only ADMIN can manage roles
 */
export function canManageRole(userRole: Role, targetRole: Role): boolean {
  return userRole === ROLES.ADMIN;
}

/**
 * Get all available roles that a user can assign
 * ADMIN can assign any role
 * Others cannot assign roles
 */
export function getAssignableRoles(userRole: Role): Role[] {
  if (userRole === ROLES.ADMIN) {
    return [ROLES.ADMIN, ROLES.OPERATOR, ROLES.USER];
  }
  return [];
}

/**
 * Validate if a role string is a valid Role
 */
export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role);
}

/**
 * Get role from string with fallback to USER
 */
export function getRoleOrDefault(role: string | undefined): Role {
  if (role && isValidRole(role)) {
    return role;
  }
  return ROLES.USER;
}

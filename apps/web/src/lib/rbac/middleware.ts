import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/server";
import { ROLES, Role, hasPermission, Permission, getRoleOrDefault } from "./roles";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    displayName?: string;
    role: Role;
  };
}

/**
 * Extract and verify Firebase token from request
 */
async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  return decodedToken;
}

/**
 * Middleware: Require authentication
 */
export async function requireAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const decodedToken = await verifyToken(req);
    
    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      displayName: decodedToken.name,
      role: getRoleOrDefault((decodedToken.role as string | undefined) || undefined),
    };

    return await handler(req, user);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized", error: error.message },
      { status: 401 }
    );
  }
}

/**
 * Middleware: Require ADMIN role
 */
export async function requireAdmin(
  req: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(req, async (req, user) => {
    if (user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { ok: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }
    return await handler(req, user);
  });
}

/**
 * Middleware: Require ADMINISTRATOR or ADMIN role
 */
export async function requireAdministrator(
  req: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(req, async (req, user) => {
    if (user.role !== ROLES.ADMIN && user.role !== ROLES.OPERATOR) {
      return NextResponse.json(
        { ok: false, message: "Forbidden: Administrator access required" },
        { status: 403 }
      );
    }
    return await handler(req, user);
  });
}

/**
 * Middleware: Require specific permission
 */
export async function requirePermission(
  req: NextRequest,
  permission: Permission,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(req, async (req, user) => {
    if (!hasPermission(user.role, permission)) {
      return NextResponse.json(
        { ok: false, message: `Forbidden: Missing permission '${permission}'` },
        { status: 403 }
      );
    }
    return await handler(req, user);
  });
}

/**
 * Middleware: Require ownership or ADMIN/ADMINISTRATOR role
 */
export async function requireOwnerOrStaff(
  req: NextRequest,
  resourceOwnerId: string,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(req, async (req, user) => {
    const isOwner = user.uid === resourceOwnerId;
    const isStaff = user.role === ROLES.ADMIN || user.role === ROLES.OPERATOR;
    
    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { ok: false, message: "Forbidden: You don't have access to this resource" },
        { status: 403 }
      );
    }
    
    return await handler(req, user);
  });
}

/**
 * Check if user can perform action on signal
 */
export function canModifySignal(userRole: Role, userId: string, signalOwnerId: string): boolean {
  // Admin and Administrator can modify any signal
  if (userRole === ROLES.ADMIN || userRole === ROLES.OPERATOR) {
    return true;
  }
  
  // Users can only modify their own signals
  return userId === signalOwnerId;
}

/**
 * Check if user can delete signal
 */
export function canDeleteSignal(userRole: Role, userId: string, signalOwnerId: string): boolean {
  // Admin can delete any signal
  if (userRole === ROLES.ADMIN) {
    return true;
  }
  
  // Administrator can delete any signal
  if (userRole === ROLES.OPERATOR) {
    return true;
  }
  
  // Users can only delete their own signals
  return userId === signalOwnerId;
}

/**
 * Check if user can change signal status
 */
export function canChangeSignalStatus(userRole: Role): boolean {
  return userRole === ROLES.ADMIN || userRole === ROLES.OPERATOR;
}

/**
 * Check if user can block other users
 */
export function canBlockUser(userRole: Role): boolean {
  return userRole === ROLES.ADMIN || userRole === ROLES.OPERATOR;
}

/**
 * Check if user can change roles
 */
export function canChangeRoles(userRole: Role): boolean {
  return userRole === ROLES.ADMIN;
}

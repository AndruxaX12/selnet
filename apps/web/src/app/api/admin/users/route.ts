import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { getAllUsers } from "@/lib/rbac/userController";
import { ROLES } from "@/lib/rbac/roles";

/**
 * GET /api/admin/users
 * Get all users (ADMIN and ADMINISTRATOR can access)
 */
export async function GET(req: NextRequest) {
  return requireAuth(req, async (req, user) => {
    // Only ADMIN can view users (Operator excluded per requirements)
    if (user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { ok: false, message: "Access denied. Admin role required." },
        { status: 403 }
      );
    }
    try {
      const result = await getAllUsers();
      
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, message: result.message },
          { status: 500 }
        );
      }

      // Apply client-side filters
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search") || "";
      const roleFilter = searchParams.get("role") || "";
      
      let users = result.users || [];
      
      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter((u: any) =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.displayName?.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by role
      if (roleFilter && roleFilter !== "all") {
        users = users.filter((u: any) => u.role === roleFilter);
      }
      
      // Sort by createdAt
      users.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      return NextResponse.json({
        ok: true,
        users,
        total: users.length,
      });
      
    } catch (error: any) {
      console.error("GET /api/admin/users error:", error);
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }
  });
}

export const dynamic = "force-dynamic";

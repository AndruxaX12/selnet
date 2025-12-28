import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac/middleware";
import { updateUserRole } from "@/lib/rbac/userController";

/**
 * POST /api/admin/update-role
 * Update user role (ADMIN only)
 * Body: { userId: string, newRole: "USER" | "ADMINISTRATOR" | "ADMIN" }
 */
export async function POST(req: NextRequest) {
  return requireAdmin(req, async (req, adminUser) => {
    try {
      const body = await req.json();
      const { userId, newRole } = body;

      if (!userId || !newRole) {
        return NextResponse.json(
          { ok: false, message: "userId and newRole are required" },
          { status: 400 }
        );
      }

      const result = await updateUserRole(userId, newRole, adminUser.uid);

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, message: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: result.message,
      });

    } catch (error: any) {
      console.error("Update role error:", error);
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }
  });
}

export const dynamic = "force-dynamic";

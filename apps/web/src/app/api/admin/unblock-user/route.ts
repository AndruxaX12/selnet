import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { unblockUser } from "@/lib/rbac/userController";
import { ROLES } from "@/lib/rbac/roles";

/**
 * POST /api/admin/unblock-user
 * Unblock user (ADMIN and ADMINISTRATOR)
 * Body: { userId: string }
 */
export async function POST(req: NextRequest) {
  return requireAuth(req, async (req, adminUser) => {
    // Only ADMIN and ADMINISTRATOR can unblock users
    if (adminUser.role !== ROLES.ADMIN && adminUser.role !== ROLES.ADMINISTRATOR) {
      return NextResponse.json(
        { ok: false, message: "Access denied. Admin or Administrator role required." },
        { status: 403 }
      );
    }
    try {
      const body = await req.json();
      const { userId } = body;

      if (!userId) {
        return NextResponse.json(
          { ok: false, message: "userId is required" },
          { status: 400 }
        );
      }

      const result = await unblockUser(userId, adminUser.uid);

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
      console.error("Unblock user error:", error);
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }
  });
}

export const dynamic = "force-dynamic";

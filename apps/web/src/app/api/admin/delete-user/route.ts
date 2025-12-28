import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac/middleware";
import { deleteUser } from "@/lib/rbac/userController";

/**
 * DELETE /api/admin/delete-user
 * Delete a user (ADMIN only)
 */
export async function DELETE(req: NextRequest) {
  return requireAdmin(req, async (req, adminUser) => {
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get("userId");

      if (!userId) {
        return NextResponse.json(
          { ok: false, message: "userId is required" },
          { status: 400 }
        );
      }

      const result = await deleteUser(userId, adminUser.uid);

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
      console.error("Delete user error:", error);
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }
  });
}

export const dynamic = "force-dynamic";

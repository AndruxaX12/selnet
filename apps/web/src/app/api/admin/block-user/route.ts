import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { blockUser } from "@/lib/rbac/userController";
import { ROLES } from "@/lib/rbac/roles";

/**
 * POST /api/admin/block-user
 * Block user (ADMIN and ADMINISTRATOR)
 * Body: { userId: string, reason?: string }
 */
export async function POST(req: NextRequest) {
  return requireAuth(req, async (req, adminUser) => {
    // Only ADMIN and ADMINISTRATOR can block users
    if (adminUser.role !== ROLES.ADMIN && adminUser.role !== ROLES.ADMINISTRATOR) {
      return NextResponse.json(
        { ok: false, message: "Access denied. Admin or Administrator role required." },
        { status: 403 }
      );
    }
    try {
      const body = await req.json();
      const { userId, reason = "No reason provided" } = body;

      if (!userId) {
        return NextResponse.json(
          { ok: false, message: "userId is required" },
          { status: 400 }
        );
      }

      // ADMINISTRATOR can only block USER role, not other admins
      if (adminUser.role === ROLES.ADMINISTRATOR) {
        // Check target user's role
        const { adminAuth, adminDb } = await import("@/lib/firebase/server");
        const targetUser = await adminAuth.getUser(userId);
        const targetUserDoc = await adminDb.collection("users").doc(userId).get();
        const targetRole = targetUser.customClaims?.role || targetUserDoc.data()?.role || ROLES.USER;
        
        if (targetRole === ROLES.ADMIN || targetRole === ROLES.ADMINISTRATOR) {
          return NextResponse.json(
            { ok: false, message: "Administrators cannot block other administrators or admins. Only users." },
            { status: 403 }
          );
        }
      }

      const result = await blockUser(userId, reason, adminUser.uid);

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
      console.error("Block user error:", error);
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }
  });
}

export const dynamic = "force-dynamic";

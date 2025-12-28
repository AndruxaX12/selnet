import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { adminAuth } from "@/lib/firebase/server";

/**
 * PUT /api/profile/update-password
 * Update user's password
 */
export async function PUT(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {
      const { uid } = user;
      const body = await req.json();

      const { newPassword } = body;

      // Validate password
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Update password in Firebase Auth
      await adminAuth.updateUser(uid, {
        password: newPassword,
      });

      return NextResponse.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error: any) {
      console.error("Update password error:", error);
      return NextResponse.json(
        { error: "Failed to update password", details: error.message },
        { status: 500 }
      );
    }
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/server";

/**
 * POST /api/auth/set-my-role
 * Set role for currently logged in user (for testing)
 * Body: { role: "USER" | "ADMINISTRATOR" | "ADMIN" }
 */
export async function POST(req: NextRequest) {
  return requireAuth(req, async (req, user) => {
    try {
      const body = await req.json();
      const { role } = body;

      if (!role) {
        return NextResponse.json(
          { ok: false, message: "Role is required" },
          { status: 400 }
        );
      }

      console.log('🔧 Setting role for current user:', user.uid, 'to:', role);

      // Set custom claims
      await adminAuth.setCustomUserClaims(user.uid, { role });
      console.log('✅ Custom claims set');

      // Update Firestore
      await adminDb.collection("users").doc(user.uid).set(
        {
          role,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log('✅ Firestore updated');

      // Verify
      const updatedUser = await adminAuth.getUser(user.uid);
      console.log('✅ Verified custom claims:', updatedUser.customClaims);

      return NextResponse.json({
        ok: true,
        message: `Role set to ${role}. Please logout and login again!`,
        customClaims: updatedUser.customClaims,
      });

    } catch (error: any) {
      console.error('❌ Set my role error:', error);
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }
  });
}

export const dynamic = "force-dynamic";

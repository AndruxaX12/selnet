import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/server";
import { ROLES } from "@/lib/rbac/roles";

/**
 * Set ADMIN role for existing user
 * POST /api/auth/set-admin-role
 * Body: { email: "admin@cenner.bg" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { ok: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await adminAuth.getUserByEmail(email);

    // Set ADMIN role in custom claims
    await adminAuth.setCustomUserClaims(user.uid, { role: ROLES.ADMIN });

    // Update Firestore
    await adminDb.collection("users").doc(user.uid).set(
      {
        email: user.email,
        displayName: user.displayName || "Root Admin",
        role: ROLES.ADMIN,
        isRootAdmin: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Log action
    await adminDb.collection("system_logs").add({
      action: "ADMIN_ROLE_SET",
      userId: user.uid,
      email: user.email,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      message: "ADMIN role set successfully",
      user: {
        uid: user.uid,
        email: user.email,
        role: ROLES.ADMIN,
      },
    });

  } catch (error: any) {
    console.error("Set admin role error:", error);
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/server";

/**
 * TEST ENDPOINT - Set role directly (for debugging)
 * POST /api/auth/test-role
 * Body: { email: string, role: "USER" | "ADMINISTRATOR" | "ADMIN" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { ok: false, message: "Email and role are required" },
        { status: 400 }
      );
    }

    console.log('🔍 TEST: Looking up user by email:', email);
    
    // Get user by email
    const userRecord = await adminAuth.getUserByEmail(email);
    console.log('✅ TEST: User found:', userRecord.uid);

    // Set custom claims
    console.log('📝 TEST: Setting custom claims - role:', role);
    await adminAuth.setCustomUserClaims(userRecord.uid, { role });
    console.log('✅ TEST: Custom claims set');

    // Update Firestore
    console.log('📝 TEST: Updating Firestore');
    await adminDb.collection("users").doc(userRecord.uid).set(
      {
        role,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log('✅ TEST: Firestore updated');

    // Verify custom claims
    const updatedUser = await adminAuth.getUser(userRecord.uid);
    console.log('🔍 TEST: Verifying custom claims:', updatedUser.customClaims);

    return NextResponse.json({
      ok: true,
      message: `Role set to ${role} for ${email}. User must logout and login again!`,
      userId: userRecord.uid,
      customClaims: updatedUser.customClaims,
    });

  } catch (error: any) {
    console.error('❌ TEST: Error:', error);
    return NextResponse.json(
      { ok: false, message: error.message, code: error.code },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

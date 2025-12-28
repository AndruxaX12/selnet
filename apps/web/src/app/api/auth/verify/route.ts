import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email и OTP са задължителни" },
        { status: 400 }
      );
    }
    
    // Validate OTP from Firestore
    const otpDoc = await adminDb
      .collection("otp_codes")
      .where("email", "==", email)
      .where("code", "==", otp)
      .where("used", "==", false)
      .limit(1)
      .get();
    
    if (otpDoc.empty) {
      return NextResponse.json(
        { error: "Грешен или изтекъл код" },
        { status: 400 }
      );
    }
    
    const otpData = otpDoc.docs[0].data();
    
    // Check expiry
    if (otpData.expires_at.toDate() < new Date()) {
      return NextResponse.json(
        { error: "Кодът е изтекъл" },
        { status: 400 }
      );
    }
    
    // Mark as used
    await otpDoc.docs[0].ref.update({ used: true, used_at: new Date() });
    
    // Find user by email and verify
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(user.uid, { emailVerified: true });
    
    // Create session token
    const token = await adminAuth.createCustomToken(user.uid);
    
    return NextResponse.json({
      success: true,
      token,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: true,
      },
    });
  } catch (error: any) {
    console.error("POST /api/auth/verify error:", error);
    return NextResponse.json(
      { error: error.message || "Грешка при потвърждение" },
      { status: 500 }
    );
  }
}

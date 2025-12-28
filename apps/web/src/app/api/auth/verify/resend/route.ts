import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email е задължителен" },
        { status: 400 }
      );
    }
    
    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to Firestore
    await adminDb.collection("otp_codes").add({
      email,
      code: otp,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      used: false,
    });
    
    // TODO: Send email with OTP
    console.log(`OTP for ${email}: ${otp}`);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/auth/verify/resend error:", error);
    return NextResponse.json(
      { error: "Грешка при изпращане на код" },
      { status: 500 }
    );
  }
}

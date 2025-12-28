import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/server";
import { ROLES } from "@/lib/rbac/roles";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Имейл и парола са задължителни" },
        { status: 400 }
      );
    }

    // Use Firebase Auth REST API to verify email and password
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBOtsHBzYm3JeZ-V5mRZjBh3DcQ-RBhGQI";
    
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || "Невалиден имейл или парола";
      return NextResponse.json(
        { ok: false, message: errorMessage === "INVALID_LOGIN_CREDENTIALS" ? "Невалиден имейл или парола" : errorMessage },
        { status: 401 }
      );
    }

    // Get user data from Admin SDK
    const user = await adminAuth.getUser(data.localId);
    
    console.log('🔍 Login - User custom claims:', user.customClaims);

    // Get role from custom claims or Firestore
    let role = user.customClaims?.role || ROLES.USER;
    
    // If no custom claims, check Firestore
    if (!user.customClaims?.role) {
      console.log('⚠️ No custom claims, checking Firestore...');
      const userDoc = await adminDb.collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        role = userData?.role || ROLES.USER;
        console.log('📝 Role from Firestore:', role);
      }
    }
    
    console.log('✅ Final role for user:', role);

    // Create custom token for client-side sign in
    const customToken = await adminAuth.createCustomToken(user.uid);

    return NextResponse.json({
      ok: true,
      customToken,
      idToken: data.idToken,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: role, // ✅ NOW INCLUDES ROLE!
        photoURL: user.photoURL || null,
      }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { ok: false, message: "Грешка при вход" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

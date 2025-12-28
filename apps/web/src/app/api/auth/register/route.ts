import { NextResponse } from "next/server";
import { RegisterSchema } from "@/lib/schemas/register";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password, displayName } = parsed.data;
    
    // Use Firebase Auth REST API to create user with password
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBOtsHBzYm3JeZ-V5mRZjBh3DcQ-RBhGQI";
    
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
          returnSecureToken: true
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || "Грешка при регистрация";
      if (errorMessage === "EMAIL_EXISTS") {
        return NextResponse.json(
          { ok: false, message: "Този имейл вече е регистриран" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, message: errorMessage },
        { status: 400 }
      );
    }

    const uid = data.localId;
    
    // Всички нови потребители са автоматично "USER" (Потребител)
    const role = "USER";

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { role });

    // Save user data to Firestore
    await adminDb.collection("users").doc(uid).set({
      uid,
      email,
      displayName,
      role,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ 
      ok: true, 
      user: { uid, email, displayName, role } 
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    const message = error?.message || "Вътрешна грешка";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

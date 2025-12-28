import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, role } = body;

    if (!uid || !role) {
      return NextResponse.json(
        { ok: false, message: "UID и роля са задължителни" },
        { status: 400 }
      );
    }

    const validRoles = ["USER", "ADMINISTRATOR", "ADMIN"] as const;
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { ok: false, message: `Невалидна роля. Валидни роли: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    await adminAuth.setCustomUserClaims(uid, { role });

    await adminDb.collection("users").doc(uid).set(
      {
        role,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const user = await adminAuth.getUser(uid);

    return NextResponse.json({
      ok: true,
      message: "Ролята е променена успешно",
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role,
      },
    });
  } catch (error: any) {
    console.error("Set role error:", error);
    return NextResponse.json(
      { ok: false, message: error.message || "Грешка при промяна на ролята" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

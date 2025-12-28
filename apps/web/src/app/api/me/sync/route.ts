import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("selnet_session")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });
  const decoded = await adminAuth.verifyIdToken(token).catch(()=>null);
  if (!decoded) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const u = await adminAuth.getUser(decoded.uid);
  const data = {
    email: u.email || null,
    displayName: u.displayName || null,
    photoURL: u.photoURL || null,
    updatedAt: Date.now()
  };
  await adminDb.collection("users").doc(decoded.uid).set(data, { merge: true });

  // (по избор) enforce unique email → Admin SDK вече го гарантира при провайдъри
  return NextResponse.json({ ok: true });
}

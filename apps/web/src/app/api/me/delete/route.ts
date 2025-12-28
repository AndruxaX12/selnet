import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("selnet_session")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });
  const decoded = await adminAuth.verifyIdToken(token).catch(()=>null);
  if (!decoded) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const uid = decoded.uid;

  // минимален cleanup: маркирай профила като deleted, опционално анонимизирай
  await adminDb.collection("users").doc(uid).set({
    deletedAt: Date.now(), displayName: null, photoURL: null
  }, { merge: true }).catch(()=>{});

  // (по избор) каскадно триене на user content → по-късно/на ръка
  await adminAuth.deleteUser(uid);
  return NextResponse.json({ ok: true });
}

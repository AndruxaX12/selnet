import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const ALLOWED = new Set(["in_progress","resolved","rejected","overdue"]);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const status = body?.status as string | undefined;
  if (!status || !ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // validate session cookie (raw idToken stored as cookie from Gen.2)
  const token = req.cookies.get("selnet_session")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

  const decoded = await adminAuth.verifyIdToken(token).catch(() => null);
  if (!decoded) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const uid = decoded.uid;
  // basic role check — read from users/{uid}
  const userDoc = await adminDb.collection("users").doc(uid).get();
  const role = userDoc.exists ? (userDoc.data()?.role as string) : "resident";
  if (!["coordinator","municipal","admin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = params.id;
  const ref = adminDb.collection("signals").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ref.update({ status, updatedAt: Date.now() });
  await ref.collection("history").add({
    at: Date.now(),
    by: uid,
    text: `Статус сменен на "${status}"`
  });

  return NextResponse.json({ ok: true });
}

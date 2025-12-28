import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const tokenCookie = req.cookies.get("selnet_session")?.value;
  if (!tokenCookie) return NextResponse.json({ error: "No session" }, { status: 401 });
  const decoded = await adminAuth.verifyIdToken(tokenCookie).catch(() => null);
  if (!decoded) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { fcmToken } = await req.json();
  if (!fcmToken) return NextResponse.json({ error: "Missing fcmToken" }, { status: 400 });

  const docRef = adminDb.collection("users").doc(decoded.uid).collection("tokens").doc(fcmToken);
  await docRef.set({
    createdAt: Date.now(),
    ua: req.headers.get("user-agent") || "unknown",
    enabled: true
  }, { merge: true });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const tokenCookie = req.cookies.get("selnet_session")?.value;
  if (!tokenCookie) return NextResponse.json({ error: "No session" }, { status: 401 });
  const decoded = await adminAuth.verifyIdToken(tokenCookie).catch(() => null);
  if (!decoded) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { fcmToken } = await req.json();
  if (!fcmToken) return NextResponse.json({ error: "Missing fcmToken" }, { status: 400 });

  const docRef = adminDb.collection("users").doc(decoded.uid).collection("tokens").doc(fcmToken);
  await docRef.delete();

  return NextResponse.json({ ok: true });
}

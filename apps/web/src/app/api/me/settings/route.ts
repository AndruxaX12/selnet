import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("selnet_session")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });
  const decoded = await adminAuth.verifyIdToken(token).catch(() => null);
  if (!decoded) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { emailOptIn, pushOptIn } = (await req.json().catch(() => ({}))) as {
    emailOptIn?: boolean; pushOptIn?: boolean;
  };

  await adminDb.collection("users").doc(decoded.uid).set(
    { settings: { emailOptIn: !!emailOptIn, pushOptIn: !!pushOptIn }, updatedAt: Date.now() },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}

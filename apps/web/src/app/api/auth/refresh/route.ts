import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const COOKIE_NAME = "selnet_session";
const MAX_AGE = 60 * 60 * 24 * 5;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

  const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const res = NextResponse.json({ ok: true, role: (decoded as any).role || null });
  res.cookies.set({
    name: COOKIE_NAME,
    value: idToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE
  });
  return res;
}

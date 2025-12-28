import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "selnet_session";
const MAX_AGE_DAYS = Number(process.env.SESSION_MAX_AGE_DAYS || 5);
const EXPIRES_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ ok: false, message: "Missing idToken" }, { status: 400 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: EXPIRES_MS });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(EXPIRES_MS / 1000)
    });
    return res;
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message ?? "Session error" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return res;
}

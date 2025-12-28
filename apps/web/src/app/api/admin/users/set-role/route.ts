import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { requireModerator } from "@/lib/admin-guard";

const ROLES = new Set(["resident","coordinator","municipal","admin"]);

export async function POST(req: NextRequest) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // само admin може да променя роли
  if (auth.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { uid, role } = await req.json().catch(() => ({}));
  if (!uid || !ROLES.has(role)) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // 1) запиши във Firestore (истина на профила)
  await adminDb.collection("users").doc(uid).set({ role, updatedAt: Date.now() }, { merge: true });

  // 2) custom claims (ускорява guard-овете)
  await adminAuth.setCustomUserClaims(uid, { role });

  // 3) bump на tokenVersion (по желание)
  // await adminAuth.revokeRefreshTokens(uid); // принудителен рефреш на токена в следващите ~ 1 минута

  return NextResponse.json({ ok: true, uid, role });
}

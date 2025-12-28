import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireModerator } from "@/lib/admin-guard"; // само мод/админ

export async function POST(req: NextRequest) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { uid, payload } = await req.json().catch(()=>({}));
  if (!uid || !payload?.title) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ref = adminDb.collection("users").doc(uid).collection("inbox").doc();
  await ref.set({
    type: "info", channel: "system",
    createdAt: Date.now(), ...payload
  });
  return NextResponse.json({ ok: true, id: ref.id });
}

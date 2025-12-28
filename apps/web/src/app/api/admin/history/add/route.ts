import { NextRequest, NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin-guard";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { coll, id, msg } = await req.json().catch(()=>({}));
  if (!["signals","ideas","events"].includes(coll) || !id || !msg) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // (по избор) провери scope: дали документът е в обхвата на модератора
  const ref = adminDb.collection(coll).doc(id);
  const h = ref.collection("history").doc();
  await h.set({ at: Date.now(), by: auth.uid, type: "note", msg: String(msg).slice(0, 2000) });
  return NextResponse.json({ ok: true, hid: h.id });
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("selnet_session")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });
  const d = await adminAuth.verifyIdToken(token).catch(()=>null);
  if (!d) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { id, all, seenOnly } = await req.json().catch(()=>({}));
  const coll = adminDb.collection("users").doc(d.uid).collection("inbox");

  if (all) {
    const snap = await coll.where("readAt","==", null).get().catch(()=>({ empty:true, docs:[] } as any));
    const batch = adminDb.batch();
    snap.docs.forEach((doc:any)=> batch.update(doc.ref, { readAt: Date.now(), seenAt: Date.now() }));
    await batch.commit();
    return NextResponse.json({ ok: true, count: snap.docs.length });
  }

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await coll.doc(id).set(seenOnly ? { seenAt: Date.now() } : { readAt: Date.now(), seenAt: Date.now() }, { merge: true });
  return NextResponse.json({ ok: true });
}

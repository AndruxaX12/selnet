import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { guard } from "../../_guard";

export async function POST(req: NextRequest) {
  const auth = await guard(req);
  if (auth instanceof NextResponse) return auth;

  const { coll, id, to, note } = await req.json();
  const ref = adminDb.collection(coll).doc(id);

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("not_found");

    const from = (snap.data() as any).status || "new";
    tx.update(ref, {
      status: to,
      statusAt: Date.now(),
      assignee: auth.uid ?? null
    });
    tx.create(ref.collection("history").doc(), {
      at: Date.now(),
      by: auth.uid,
      action: "status",
      from,
      to,
      note: note || ""
    });
  });

  return NextResponse.json({ ok: true });
}

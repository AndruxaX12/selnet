import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { guard } from "../../_guard";

export async function POST(req: NextRequest) {
  const auth = await guard(req);
  if (auth instanceof NextResponse) return auth;

  const { coll, ids, action, payload } = await req.json();
  const batch = adminDb.batch();

  ids.forEach((id: string) => {
    const ref = adminDb.collection(coll).doc(id);

    if (action === "status") {
      batch.update(ref, {
        status: payload.to,
        statusAt: Date.now(),
        assignee: auth.uid ?? null
      });
      batch.create(ref.collection("history").doc(), {
        at: Date.now(),
        by: auth.uid,
        action: "status",
        from: "bulk",
        to: payload.to
      });
    } else if (action === "assign") {
      batch.update(ref, {
        assignee: payload.uid,
        assignedAt: Date.now()
      });
    } else if (action === "tag") {
      batch.update(ref, {
        tags: payload.tags || []
      });
    } else if (action === "archive") {
      batch.update(ref, {
        status: "archived",
        statusAt: Date.now()
      });
    }
  });

  await batch.commit();
  return NextResponse.json({ ok: true, count: ids.length });
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireModerator, isDocInScope } from "@/lib/admin-guard";

export async function POST(req: NextRequest) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { ids, status } = await req.json().catch(()=>({}));
  const ALLOWED = new Set(["in_progress","resolved","rejected","overdue"]);
  if (!Array.isArray(ids) || ids.length === 0 || !ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // ако е admin — без ограничение; иначе филтрирай по обхват
  let allowedIds = ids;
  if (auth.role !== "admin") {
    const snaps = await Promise.all(ids.map((id: string)=>adminDb.collection("signals").doc(id).get()));
    allowedIds = snaps
      .filter(s => s.exists && isDocInScope({ id: s.id, ...s.data() }, auth.scopes))
      .map(s => s.id);
  }
  if (allowedIds.length === 0) {
    return NextResponse.json({ error: "No documents in scope" }, { status: 403 });
  }

  const batch = adminDb.batch();
  allowedIds.forEach((id: string) => {
    const ref = adminDb.collection("signals").doc(id);
    batch.update(ref, { status, updatedAt: Date.now() });
    batch.set(ref.collection("history").doc(), {
      at: Date.now(), by: auth.uid, text: `Статус сменен на "${status}" (bulk)`
    });
  });
  await batch.commit();

  return NextResponse.json({ ok: true, count: allowedIds.length, status });
}

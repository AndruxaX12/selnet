import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireModerator, isDocInScope } from "@/lib/admin-guard";

const EDITABLE: Record<string, string[]> = {
  signals: ["title","desc","status","type","settlementId","settlementLabel"],
  ideas:   ["title","desc","status","settlementId","settlementLabel"],
  events:  ["title","desc","where","when","settlementId","settlementLabel"]
};

export async function POST(req: NextRequest) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { coll, id, patch } = await req.json().catch(()=>({}));
  if (!["signals","ideas","events"].includes(coll) || !id || typeof patch !== "object") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const allowed = EDITABLE[coll].reduce((acc, k) => (k in patch ? (acc[k]=patch[k], acc) : acc), {} as any);
  if (!Object.keys(allowed).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // scope check
  const ref = adminDb.collection(coll).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (auth.role !== "admin" && !isDocInScope(snap.data(), auth.scopes)) {
    return NextResponse.json({ error: "Out of scope" }, { status: 403 });
  }

  allowed.updatedAt = Date.now();
  await ref.update(allowed);

  // (по желание) история
  await ref.collection("history").add({ at: Date.now(), by: auth.uid, type: "edit", msg: "Inline edit", diff: allowed });

  return NextResponse.json({ ok: true });
}

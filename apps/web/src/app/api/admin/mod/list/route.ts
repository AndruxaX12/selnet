import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { guard } from "../../_guard";

export async function GET(req: NextRequest) {
  const auth = await guard(req);
  if (auth instanceof NextResponse) return auth;

  const sp = new URL(req.url).searchParams;
  const coll = (sp.get("coll") || "signals") as "signals" | "ideas" | "events";
  const status = sp.get("status") || "new";
  const limit = Math.min(Number(sp.get("limit") || 100), 500);

  let q = adminDb
    .collection(coll)
    .where("status", "==", status)
    .orderBy("createdAt", "desc")
    .limit(limit);

  const snap = await q.get();
  const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
  return NextResponse.json({ rows });
}

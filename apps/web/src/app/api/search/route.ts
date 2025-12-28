import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim().toLowerCase();
  if (!q) return NextResponse.json({ rows: [] });
  const maxPerColl = 60;
  async function fetchColl(coll: "signals"|"ideas"|"events") {
    const snap = await adminDb.collection(coll).orderBy("createdAt","desc").limit(800).get(); // events: може when
    return snap.docs.map(d => ({ id: d.id, coll, ...(d.data() as any) }))
      .filter(x => `${x.title||""} ${x.desc||""} ${x.settlementLabel||""}` .toLowerCase().includes(q))
      .slice(0, maxPerColl);
  }
  const [s,i,e] = await Promise.all([fetchColl("signals"), fetchColl("ideas"), fetchColl("events")]);
  return NextResponse.json({ rows: [...s,...i,...e].slice(0, 100) });
}

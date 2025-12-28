import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireModerator } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const since = Date.now() - 31*24*3600*1000;

  try {
    const dailySnap = await adminDb.collection("telemetry").doc("vitals").collection("daily")
      .orderBy("day","asc").get();
    const daily = dailySnap.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .filter(d => new Date(d.day).getTime() >= since);

    const errSnap = await adminDb.collection("telemetry").doc("errors").collection("client")
      .where("at",">=", Date.now()-24*3600*1000).orderBy("at","desc").limit(50).get();
    const errors = errSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    return NextResponse.json({ daily, errors });
  } catch (error) {
    console.error("Health API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

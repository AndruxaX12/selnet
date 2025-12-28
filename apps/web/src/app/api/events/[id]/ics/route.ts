import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { icsForEvent } from "@/lib/ics";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const snap = await adminDb.collection("events").doc(params.id).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const x: any = snap.data();
  const body = icsForEvent({ id: snap.id, title: x.title||"Event", desc: x.desc, where: x.where, when: Number(x.when), durationMin: x.durationMin||60 });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.id}.ics"`
    }
  });
}

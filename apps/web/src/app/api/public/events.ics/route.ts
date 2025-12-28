import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { icsForEvents } from "@/lib/ics";
import { rlGuard } from "../../_rl";

export async function GET(req: NextRequest) {
  const block = await rlGuard(req, "public:ics", { windowSec: 60, capacity: 60, refill: 60 });
  if (block) return block;

  const sp = new URL(req.url).searchParams;
  const limit = Math.min(Number(sp.get("limit") || 200), 1000);
  const since = Number(sp.get("since") || (Date.now() - 90*24*3600*1000)); // 90 дни назад

  const snap = await adminDb.collection("events").where("when",">=", since).orderBy("when","asc").limit(limit).get();
  const events = snap.docs.map(d => {
    const x:any = d.data();
    return {
      id: d.id,
      title: x.title||"Event",
      desc: x.desc,
      where: x.where,
      when: Number(x.when),
      durationMin: x.durationMin||60
    };
  });

  const ics = icsForEvents(events);
  return new NextResponse(ics, {
    headers: {
      "Content-Type":"text/calendar; charset=utf-8",
      "Cache-Control":"public, max-age=300"
    }
  });
}

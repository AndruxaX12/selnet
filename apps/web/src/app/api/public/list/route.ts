import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rlGuard } from "../../_rl";

export async function GET(req: NextRequest) {
  const block = await rlGuard(req, "public:list", { windowSec: 60, capacity: 100, refill: 100 });
  if (block) return block;

  const sp = new URL(req.url).searchParams;
  const coll = (sp.get("coll") || "signals") as "signals"|"ideas"|"events";
  const limit = Math.min(Number(sp.get("limit") || 20), 100);
  const since = Number(sp.get("since") || 0);
  const settlementId = sp.get("settlementId") || undefined;

  let q = adminDb.collection(coll).orderBy(coll==="events"?"when":"createdAt","desc").limit(500);
  if (since) q = q.where(coll==="events"?"when":"createdAt",">=", since);
  if (settlementId) q = q.where("settlementId","==", settlementId);

  const snap = await q.get();
  const rows = snap.docs.slice(0, limit).map(d => sanitize(d.id, d.data(), coll));
  return json(rows);
}

function sanitize(id:string, x:any, coll:string) {
  // само публични полета
  const geo = x.geo || x.location || null;
  const base:any = {
    id,
    title: x.title||"",
    desc: (x.desc||"").slice(0,280),
    settlementLabel: x.settlementLabel||"",
    geo,
    status: x.status || null,
    category: x.category || null
  };
  if (coll==="events") { base.when = x.when||null; base.where = x.where||""; }
  if (coll!=="events") { base.createdAt = x.createdAt||null; }
  base.url = `/${coll}/${id}` ;
  return base;
}

function json(data:any) {
  return new NextResponse(JSON.stringify({ rows: data }), {
    headers: {
      "Content-Type":"application/json; charset=utf-8",
      "Access-Control-Allow-Origin":"*",
      "Cache-Control":"no-store, no-cache, must-revalidate"
    }
  });
}

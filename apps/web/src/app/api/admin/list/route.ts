import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireModerator, isDocInScope } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sp = new URL(req.url).searchParams;
  const coll = (sp.get("coll") || "signals") as "signals"|"ideas"|"events";
  const qText = (sp.get("q") || "").trim().toLowerCase();
  const status = sp.get("status");
  const settlementId = sp.get("settlementId");
  const start = Number(sp.get("start") || 0);      // пагинация offset (server-side light)
  const limit = Math.min(Number(sp.get("limit") || 50), 200);
  const sort = sp.get("sort") || (coll === "events" ? "when" : "createdAt");
  const dir = (sp.get("dir") === "asc" ? "asc" : "desc") as "asc"|"desc";
  const from = Number(sp.get("from") || 0);
  const to = Number(sp.get("to") || 0);

  // базова заявка
  let queryRef = adminDb.collection(coll).orderBy(sort, dir).limit(1000);

  // семпли филтри (част от тях ще се приложат клиентски при нужда)
  if (status && (coll === "signals" || coll === "ideas")) {
    queryRef = adminDb.collection(coll).where("status", "==", status).orderBy(sort, dir).limit(1000);
  }
  if (settlementId) {
    queryRef = adminDb.collection(coll).where("settlementId","==", settlementId).orderBy(sort, dir).limit(1000);
  }
  const snap = await queryRef.get();
  let rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  // времеви филтър
  if (from || to) {
    const key = coll === "events" ? "when" : "createdAt";
    rows = rows.filter(r => {
      const v = Number(r[key] || 0);
      if (from && v < from) return false;
      if (to && v > to) return false;
      return true;
    });
  }

  // текстово търсене (клиентско/сървърно опростено)
  if (qText) {
    rows = rows.filter(r => {
      const hay = `${r.title || ""} ${r.desc || ""} ${r.settlementLabel || ""}` .toLowerCase();
      return hay.includes(qText);
    });
  }

  // scope (ако не е admin) — клиентска филтрация
  if (auth.role !== "admin") {
    rows = rows.filter(r => isDocInScope(r, auth.scopes));
  }

  const total = rows.length;
  rows = rows.slice(start, start + limit);

  return NextResponse.json({ coll, total, rows });
}

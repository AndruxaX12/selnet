import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireModerator } from "@/lib/admin-guard";
import { Parser as Json2Csv } from "json2csv";

export async function GET(req: NextRequest) {
  const guard = await requireModerator(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { searchParams } = new URL(req.url);
  const collection = (searchParams.get("collection") || "signals") as "signals"|"ideas"|"events";
  const format = (searchParams.get("format") || "csv") as "csv"|"json";
  const limit = Math.min(parseInt(searchParams.get("limit") || "2000"), 10000);
  const status = searchParams.get("status") || null;

  let q = adminDb.collection(collection)
    .orderBy(collection === "events" ? "when" : "createdAt", "desc")
    .limit(limit);
  if (status && (collection === "signals" || collection === "ideas")) {
    q = adminDb.collection(collection).where("status", "==", status)
      .orderBy("createdAt", "desc")
      .limit(limit);
  }

  const snap = await q.get();
  const rows = snap.docs.map(d => {
    const x = d.data() as any;
    return {
      id: d.id,
      title: x.title || "",
      desc: x.desc || "",
      settlementId: x.settlementId || "",
      type: x.type || "",
      status: x.status || "",
      createdAt: x.createdAt || null,
      updatedAt: x.updatedAt || null,
      when: x.when || null,
      where: x.where || "",
      lat: x.geo?.lat ?? null,
      lng: x.geo?.lng ?? null,
      authorUid: x.authorUid || x.createdBy || ""
    };
  });

  if (format === "json") {
    return new NextResponse(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename=${collection}.json`  }
    });
  }

  const parser = new Json2Csv({ fields: Object.keys(rows[0] || { id: "", title: "" }) });
  const csv = parser.parse(rows);
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=${collection}.csv`  }
  });
}

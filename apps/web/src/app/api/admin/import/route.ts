import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireModerator } from "@/lib/admin-guard";
import { parse } from "csv-parse/sync";

type Coll = "signals" | "ideas" | "events";

export async function POST(req: NextRequest) {
  const guard = await requireModerator(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { collection, csv } = await req.json().catch(()=>({}));
  if (!csv || !["signals","ideas","events"].includes(collection)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const records = parse(csv, { columns: true, skip_empty_lines: true, bom: true });
  let inserted = 0, skipped = 0;

  for (const r of records) {
    try {
      const title = (r.title || "").toString().trim();
      if (!title) { skipped++; continue; }

      const base: any = {
        title,
        desc: (r.desc || "").toString(),
        settlementId: (r.settlementId || "").toString(),
        createdAt: Number(r.createdAt) || Date.now(),
        updatedAt: Date.now()
      };

      if (collection === "signals") {
        base.type = (r.type || "друго").toString();
        base.status = (r.status || "new").toString();
        if (r.lat && r.lng) base.geo = { lat: Number(r.lat), lng: Number(r.lng) };
      } else if (collection === "ideas") {
        base.status = (r.status || "new").toString();
        base.votesCount = Number(r.votesCount || 0);
      } else if (collection === "events") {
        base.when = Number(r.when) || Date.now();
        base.where = (r.where || "").toString();
        if (r.lat && r.lng) base.geo = { lat: Number(r.lat), lng: Number(r.lng) };
        base.yesCount = Number(r.yesCount || 0);
        base.noCount = Number(r.noCount || 0);
        base.maybeCount = Number(r.maybeCount || 0);
      }

      const ref = await adminDb.collection(collection as Coll).add(base);
      inserted++;

      // Log import to history
      await ref.collection("history").add({
        at: Date.now(),
        by: guard.uid,
        type: "import",
        msg: "Импортирано от CSV"
      });
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, inserted, skipped });
}

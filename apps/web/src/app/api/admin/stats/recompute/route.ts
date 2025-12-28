import { NextRequest, NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin-guard";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) initializeApp({ projectId: "selnet-ab187" });

export async function POST(req: NextRequest) {
  const guard = await requireModerator(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  // За простота: server-side ад-хок пресмятане (малки набори). За големи – ползвай Cloud Function.
  const db = getFirestore();
  const res = await fetch(new URL(req.url).origin + "/api/admin/stats").catch(()=>null);
  // В реалност тук можеш да извикаш callable функцията; този endpoint е placeholder.
  return NextResponse.json({ ok: true, note: "За пълната логика използвай Cloud Function statsOnCall/statsDaily" });
}

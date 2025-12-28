import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rlGuard } from "../../_rl";

const ALLOWED = new Set(["signals", "ideas", "events"]);

export async function GET(req: NextRequest) {
  const block = await rlGuard(req, "public:ids", { windowSec: 60, capacity: 120, refill: 120 });
  if (block) return block;

  const coll = req.nextUrl.searchParams.get("coll") || "";
  if (!ALLOWED.has(coll)) {
    return NextResponse.json({ rows: [] }, { status: 400 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 500), 1000);

  try {
    const snap = await adminDb
      .collection(coll)
      .orderBy("updatedAt", "desc")
      .select()
      .limit(limit)
      .get();

    const rows = snap.docs.map((doc) => ({ id: doc.id, updatedAt: doc.get("updatedAt") || null }));
    return NextResponse.json({ rows }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    console.error("public ids error", error);
    return NextResponse.json({ rows: [] }, { status: 500 });
  }
}

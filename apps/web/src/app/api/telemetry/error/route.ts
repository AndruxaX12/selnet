import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rlGuard } from "../../_rl";

const MAX_SIZE = 4096;

export async function POST(req: NextRequest) {
  const block = await rlGuard(req, "telemetry:error", { windowSec: 60, capacity: 30, refill: 30 });
  if (block) return block;

  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_SIZE) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.msg) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const now = Date.now();
  const doc = {
    msg: String(body.msg).slice(0, 500),
    src: String(body.src || "").slice(0, 200),
    ln: Number(body.ln || 0),
    col: Number(body.col || 0),
    url: String(body.url || ""),
    at: now,
    ua: (req.headers.get("user-agent") || "").slice(0, 256)
  };

  try {
    // Проверка дали Firebase Admin е конфигуриран
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      // В development режим без credentials, само логвай в конзолата
      console.log("[Telemetry] Client error:", doc);
      return NextResponse.json({ ok: true });
    }
    
    await adminDb.collection("telemetry_errors").add(doc);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telemetry error API failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

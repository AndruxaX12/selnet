import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rlGuard } from "../../_rl";

const MAX_SIZE = 4096;

export async function POST(req: NextRequest) {
  const block = await rlGuard(req, "telemetry:vitals", { windowSec: 60, capacity: 60, refill: 60 });
  if (block) return block;

  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_SIZE) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.name) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const now = Date.now();
  const doc = {
    ...pick(body, ["id", "name", "value", "rating", "navType", "url"]),
    value: Number(body.value ?? 0),
    at: now,
    ua: (req.headers.get("user-agent") || "").slice(0, 256)
  };

  try {
    // Проверка дали Firebase Admin е конфигуриран
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      // В development режим без credentials, само логвай в конзолата
      console.log("[Telemetry] Web vitals:", doc);
      return NextResponse.json({ ok: true });
    }
    
    await adminDb.collection("telemetry_vitals").add(doc);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Vitals API error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

function pick(source: Record<string, unknown>, keys: string[]) {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in source) {
      result[key] = source[key];
    }
  }
  return result;
}

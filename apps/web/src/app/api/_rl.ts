import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate/limit";

function clientKey(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || (req as unknown as { ip?: string }).ip || "0.0.0.0";
  const ua = (req.headers.get("user-agent") || "unknown").slice(0, 32);
  return `${ip}:${ua}`;
}

export async function rlGuard(
  req: NextRequest,
  channel: string,
  opts?: Partial<{ windowSec: number; capacity: number; refill: number }>
) {
  const key = clientKey(req);
  const { allowed } = await rateLimit({
    key,
    channel,
    windowSec: opts?.windowSec ?? 60,
    capacity: opts?.capacity ?? 60,
    refill: opts?.refill ?? 60
  });

  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  return null;
}

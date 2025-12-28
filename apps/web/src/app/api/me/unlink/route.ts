import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("selnet_session")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });
  const decoded = await adminAuth.verifyIdToken(token).catch(()=>null);
  if (!decoded) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { providerId } = await req.json().catch(()=>({}));
  if (!providerId) return NextResponse.json({ error: "Missing providerId" }, { status: 400 });

  const user = await adminAuth.getUser(decoded.uid);
  const current = user.providerData.map(p=>p.providerId);
  if (current.length <= 1) return NextResponse.json({ error: "Cannot unlink last provider" }, { status: 400 });

  await adminAuth.updateUser(decoded.uid, {
    providersToUnlink: [providerId]
  }).catch(()=>{});

  return NextResponse.json({ ok: true });
}

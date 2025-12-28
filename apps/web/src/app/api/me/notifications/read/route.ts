import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
    }

    const batch = adminDb.batch();
    const now = Date.now();

    for (const id of ids) {
      const ref = adminDb.collection("notifications").doc(id);
      const doc = await ref.get();
      
      if (doc.exists && doc.data()?.user_id === userId) {
        batch.update(ref, { read_at: now });
      }
    }

    await batch.commit();

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("POST /api/me/notifications/read error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

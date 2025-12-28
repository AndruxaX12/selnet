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

    const snapshot = await adminDb
      .collection("notifications")
      .where("user_id", "==", userId)
      .where("read_at", "==", null)
      .get();

    const batch = adminDb.batch();
    const now = Date.now();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read_at: now });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      marked_count: snapshot.size
    });
  } catch (error: any) {
    console.error("POST /api/me/notifications/read-all error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

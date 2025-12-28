import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const unread = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = adminDb
      .collection("notifications")
      .where("user_id", "==", userId);

    if (category && category !== "all") {
      query = query.where("category", "==", category) as any;
    }

    if (unread) {
      query = query.where("read_at", "==", null) as any;
    }

    query = query.orderBy("created_at", "desc").limit(limit);

    const snapshot = await query.get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Count unread
    const unreadSnapshot = await adminDb
      .collection("notifications")
      .where("user_id", "==", userId)
      .where("read_at", "==", null)
      .get();

    return NextResponse.json({
      items,
      unread_count: unreadSnapshot.size,
      has_more: snapshot.docs.length === limit
    });
  } catch (error: any) {
    console.error("GET /api/me/notifications error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

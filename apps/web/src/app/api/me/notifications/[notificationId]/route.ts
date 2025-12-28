import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;
    const { notificationId } = params;

    const notifRef = adminDb.collection("notifications").doc(notificationId);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (notifDoc.data()?.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await notifRef.delete();

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("DELETE /api/me/notifications/:id error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { exportId: string } }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;
    const { exportId } = params;

    const exportDoc = await adminDb.collection("exports").doc(exportId).get();

    if (!exportDoc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = exportDoc.data();
    if (data?.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if expired
    if (data?.expires_at && data.expires_at < Date.now()) {
      return NextResponse.json({
        id: exportDoc.id,
        status: "expired",
        requested_at: data.requested_at
      });
    }

    // Return status without inline data
    return NextResponse.json({
      id: exportDoc.id,
      status: data?.status,
      requested_at: data?.requested_at,
      ready_at: data?.ready_at,
      expires_at: data?.expires_at,
      size_bytes: data?.size_bytes
    });
  } catch (error: any) {
    console.error("GET /api/me/export/:id error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

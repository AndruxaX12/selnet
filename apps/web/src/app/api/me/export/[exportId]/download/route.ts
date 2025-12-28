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

    if (data?.status !== "ready") {
      return NextResponse.json({ error: "Export not ready" }, { status: 400 });
    }

    if (data?.expires_at && data.expires_at < Date.now()) {
      return NextResponse.json({ error: "Export expired" }, { status: 410 });
    }

    // Return JSON file as download
    return new NextResponse(data?.data, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="selnet-export-${exportId}.json"`
      }
    });
  } catch (error: any) {
    console.error("GET /api/me/export/:id/download error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

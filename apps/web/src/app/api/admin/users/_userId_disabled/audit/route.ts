import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await apiRequireRole(["admin"]);
    const { userId } = params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    
    const snapshot = await adminDb
      .collection("audit_logs")
      .where("target.id", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();
    
    const items = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString()
    }));
    
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("GET /api/admin/users/[userId]/audit error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

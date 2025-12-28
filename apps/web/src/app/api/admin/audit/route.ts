import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { guard } from "../_guard";

export async function GET(req: NextRequest) {
  const auth = await guard(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    
    const query = adminDb
      .collection("audit_logs")
      .orderBy("timestamp", "desc")
      .limit(limit);
    
    const snapshot = await query.get();
    
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("GET /api/admin/audit error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

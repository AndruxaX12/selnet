import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    await apiRequireRole(["ombudsman", "admin"]);
    
    const snapshot = await adminDb
      .collection("complaints")
      .orderBy("created_at", "desc")
      .limit(100)
      .get();
    
    const complaints = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate().toISOString(),
      updated_at: doc.data().updated_at?.toDate().toISOString(),
    }));
    
    return NextResponse.json({ complaints });
  } catch (error: any) {
    console.error("GET /api/ombudsman/complaints error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    await apiRequireRole(["operator", "admin"]);
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get all active signals
    const allSignals = await adminDb
      .collection("signals")
      .where("status", "in", ["new", "in_progress"])
      .get();
    
    const newSignals = allSignals.docs.filter(
      (doc) => doc.data().status === "new"
    );
    
    const inProgressSignals = allSignals.docs.filter(
      (doc) => doc.data().status === "in_progress"
    );
    
    const overdueSignals = allSignals.docs.filter((doc) => {
      const deadline = doc.data().sla_deadline?.toDate();
      return deadline && deadline < now;
    });
    
    // Get resolved today
    const resolvedToday = await adminDb
      .collection("signals")
      .where("status", "==", "resolved")
      .where("updated_at", ">=", todayStart)
      .get();
    
    return NextResponse.json({
      total: allSignals.size,
      new: newSignals.length,
      in_progress: inProgressSignals.length,
      overdue: overdueSignals.length,
      resolved_today: resolvedToday.size,
    });
  } catch (error: any) {
    console.error("GET /api/operator/stats error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

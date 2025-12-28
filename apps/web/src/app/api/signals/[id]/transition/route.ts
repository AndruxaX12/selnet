import { NextRequest, NextResponse } from "next/server";
import { apiRequirePermission } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await apiRequirePermission("signal:transition");
    const { id } = params;
    const { status } = await req.json();
    
    if (!status || !["new", "in_progress", "resolved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Невалиден статус" }, { status: 400 });
    }
    
    const signalRef = adminDb.collection("signals").doc(id);
    const signalDoc = await signalRef.get();
    
    if (!signalDoc.exists) {
      return NextResponse.json({ error: "Сигналът не съществува" }, { status: 404 });
    }
    
    const oldStatus = signalDoc.data()?.status;
    
    await signalRef.update({
      status,
      updated_at: new Date(),
      updated_by: user.uid,
    });
    
    // Log transition
    await adminDb.collection("signal_history").add({
      signal_id: id,
      action: "status_changed",
      old_status: oldStatus,
      new_status: status,
      actor_id: user.uid,
      actor_email: user.email,
      timestamp: new Date(),
    });
    
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error("POST /api/signals/[id]/transition error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { apiRequirePermission } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await apiRequirePermission("signal:verify");
    const { id } = params;
    
    const signalRef = adminDb.collection("signals").doc(id);
    const signalDoc = await signalRef.get();
    
    if (!signalDoc.exists) {
      return NextResponse.json({ error: "Сигналът не съществува" }, { status: 404 });
    }
    
    await signalRef.update({
      verified: true,
      verified_by: user.uid,
      verified_at: new Date(),
      status: "in_progress",
      updated_at: new Date(),
    });
    
    // Log action
    await adminDb.collection("signal_history").add({
      signal_id: id,
      action: "verified",
      actor_id: user.uid,
      actor_email: user.email,
      timestamp: new Date(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/signals/[id]/verify error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

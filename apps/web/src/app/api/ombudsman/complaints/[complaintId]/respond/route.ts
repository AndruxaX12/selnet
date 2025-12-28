import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { complaintId: string } }
) {
  try {
    const user = await apiRequireRole(["ombudsman", "admin"]);
    const { complaintId } = params;
    const { response } = await req.json();
    
    if (!response || !response.trim()) {
      return NextResponse.json(
        { error: "Отговорът не може да бъде празен" },
        { status: 400 }
      );
    }
    
    const complaintRef = adminDb.collection("complaints").doc(complaintId);
    const complaintDoc = await complaintRef.get();
    
    if (!complaintDoc.exists) {
      return NextResponse.json({ error: "Жалбата не съществува" }, { status: 404 });
    }
    
    // Update complaint status
    await complaintRef.update({
      status: "responded",
      response,
      responded_by: user.uid,
      responded_at: new Date(),
      updated_at: new Date(),
    });
    
    // Log response
    await adminDb.collection("complaint_responses").add({
      complaint_id: complaintId,
      response,
      responder_id: user.uid,
      responder_email: user.email,
      created_at: new Date(),
    });
    
    const updated = await complaintRef.get();
    
    return NextResponse.json({
      complaint: {
        id: updated.id,
        ...updated.data(),
        created_at: updated.data()?.created_at?.toDate().toISOString(),
        updated_at: updated.data()?.updated_at?.toDate().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("POST /api/ombudsman/complaints/[complaintId]/respond error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

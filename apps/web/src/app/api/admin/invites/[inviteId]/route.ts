import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { guard } from "../../_guard";

// DELETE /api/admin/invites/:id - Cancel/reject invite
export async function DELETE(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  const auth = await guard(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { inviteId } = params;
    
    const inviteRef = adminDb.collection("invites").doc(inviteId);
    const inviteDoc = await inviteRef.get();
    
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: "Поканата не съществува" }, { status: 404 });
    }
    
    const inviteData = inviteDoc.data();
    
    // Update status instead of deleting
    await inviteRef.update({
      status: "rejected",
      rejectedAt: Date.now(),
      rejectedBy: auth.uid,
    });
    
    // Log audit
    await adminDb.collection("audit_logs").add({
      event: "invite.cancelled",
      timestamp: Date.now(),
      actor: {
        id: auth.uid,
        email: auth.email || "unknown",
        roles: auth.roles || [],
      },
      target: {
        type: "invite",
        id: inviteId,
        email: inviteData?.email,
      },
      details: {
        role: inviteData?.role,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/invites/[inviteId] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

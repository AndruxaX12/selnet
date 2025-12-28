import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { guard } from "../../../_guard";

export async function POST(
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
      return NextResponse.json(
        { error: "Поканата не съществува" },
        { status: 404 }
      );
    }
    
    const inviteData = inviteDoc.data();
    
    if (inviteData?.status !== "pending") {
      return NextResponse.json(
        { error: "Само pending покани могат да се изпратят отново" },
        { status: 400 }
      );
    }
    
    // Extend expiration by 7 days
    const newExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    
    await inviteRef.update({
      expiresAt: newExpiresAt,
      resentAt: Date.now(),
      resentBy: auth.uid,
    });
    
    // TODO: Resend email
    console.log(`Invite resent to ${inviteData?.email}`);
    
    // Log audit
    await adminDb.collection("audit_logs").add({
      event: "invite.resent",
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
        newExpiresAt,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/admin/invites/[inviteId]/resend error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

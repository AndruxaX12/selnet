import { NextRequest, NextResponse } from "next/server";
import { apiRequirePermission } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await apiRequirePermission("rsvp:event");
    const { id } = params;
    
    const eventRef = adminDb.collection("events").doc(id);
    const rsvpRef = adminDb.collection("event_rsvps").doc(`${id}_${user.uid}`);
    
    const rsvpDoc = await rsvpRef.get();
    
    if (rsvpDoc.exists) {
      // Remove RSVP
      await rsvpRef.delete();
      await eventRef.update({
        rsvp_count: adminDb.FieldValue.increment(-1),
      });
      
      return NextResponse.json({ rsvp: false });
    } else {
      // Add RSVP
      await rsvpRef.set({
        event_id: id,
        user_id: user.uid,
        created_at: new Date(),
      });
      
      await eventRef.update({
        rsvp_count: adminDb.FieldValue.increment(1),
      });
      
      return NextResponse.json({ rsvp: true });
    }
  } catch (error: any) {
    console.error("POST /api/events/[id]/rsvp error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

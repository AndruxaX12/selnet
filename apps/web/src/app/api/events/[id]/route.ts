import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { adminDb } from "@/lib/firebase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    
    const eventDoc = await adminDb.collection("events").doc(id).get();
    
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Събитието не съществува" }, { status: 404 });
    }
    
    const eventData = eventDoc.data();
    
    const isOwner = eventData?.organizer_id === user.uid;
    const isAdmin = user.role === "admin";
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    await eventDoc.ref.delete();
    
    // Delete comments
    const commentsSnapshot = await adminDb
      .collection("comments")
      .where("resource_type", "==", "event")
      .where("resource_id", "==", id)
      .get();
    
    await Promise.all(commentsSnapshot.docs.map((doc) => doc.ref.delete()));
    
    // Delete RSVPs
    const rsvpsSnapshot = await adminDb
      .collection("event_rsvps")
      .where("event_id", "==", id)
      .get();
    
    await Promise.all(rsvpsSnapshot.docs.map((doc) => doc.ref.delete()));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

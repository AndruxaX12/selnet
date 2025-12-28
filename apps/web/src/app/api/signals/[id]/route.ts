import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { adminDb } from "@/lib/firebase-admin";
import { can } from "@/lib/auth/policies";

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
    
    const signalDoc = await adminDb.collection("signals").doc(id).get();
    
    if (!signalDoc.exists) {
      return NextResponse.json({ error: "Сигналът не съществува" }, { status: 404 });
    }
    
    const signalData = signalDoc.data();
    
    // Check permissions: owner or admin
    const isOwner = signalData?.author_id === user.uid;
    const isAdmin = user.role === "admin";
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Delete signal
    await signalDoc.ref.delete();
    
    // Delete all comments
    const commentsSnapshot = await adminDb
      .collection("comments")
      .where("resource_type", "==", "signal")
      .where("resource_id", "==", id)
      .get();
    
    const deletePromises = commentsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);
    
    // Delete all followers
    const followersSnapshot = await adminDb
      .collection("signal_followers")
      .where("signal_id", "==", id)
      .get();
    
    const deleteFollowers = followersSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deleteFollowers);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/signals/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    
    const ideaDoc = await adminDb.collection("ideas").doc(id).get();
    
    if (!ideaDoc.exists) {
      return NextResponse.json({ error: "Идеята не съществува" }, { status: 404 });
    }
    
    const ideaData = ideaDoc.data();
    
    const isOwner = ideaData?.author_id === user.uid;
    const isAdmin = user.role === "admin";
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    await ideaDoc.ref.delete();
    
    // Delete comments
    const commentsSnapshot = await adminDb
      .collection("comments")
      .where("resource_type", "==", "idea")
      .where("resource_id", "==", id)
      .get();
    
    await Promise.all(commentsSnapshot.docs.map((doc) => doc.ref.delete()));
    
    // Delete supporters
    const supportersSnapshot = await adminDb
      .collection("idea_supporters")
      .where("idea_id", "==", id)
      .get();
    
    await Promise.all(supportersSnapshot.docs.map((doc) => doc.ref.delete()));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/ideas/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

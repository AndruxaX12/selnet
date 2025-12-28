import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { adminDb } from "@/lib/firebase-admin";
import { can } from "@/lib/auth/policies";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id, commentId } = params;
    
    const commentDoc = await adminDb.collection("comments").doc(commentId).get();
    
    if (!commentDoc.exists) {
      return NextResponse.json({ error: "Коментарът не съществува" }, { status: 404 });
    }
    
    const commentData = commentDoc.data();
    
    // Check permissions: owner or moderator/admin
    const isOwner = commentData?.author_id === user.uid;
    const canModerate = can(user.role as any, "moderate:any");
    
    if (!isOwner && !canModerate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Delete comment
    await commentDoc.ref.delete();
    
    // Delete all replies
    const repliesSnapshot = await adminDb
      .collection("comments")
      .where("parent_id", "==", commentId)
      .get();
    
    const deletePromises = repliesSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);
    
    // Update comments count
    const decrementBy = 1 + repliesSnapshot.size;
    await adminDb.collection("signals").doc(id).update({
      comments_count: adminDb.FieldValue.increment(-decrementBy),
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/signals/[id]/comments/[commentId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

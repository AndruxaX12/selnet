import { NextRequest, NextResponse } from "next/server";
import { apiRequirePermission } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const snapshot = await adminDb
      .collection("comments")
      .where("resource_type", "==", "event")
      .where("resource_id", "==", id)
      .where("parent_id", "==", null)
      .orderBy("created_at", "desc")
      .get();
    
    const comments = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        const repliesSnapshot = await adminDb
          .collection("comments")
          .where("parent_id", "==", doc.id)
          .orderBy("created_at", "asc")
          .get();
        
        const replies = repliesSnapshot.docs.map((replyDoc) => ({
          id: replyDoc.id,
          ...replyDoc.data(),
          created_at: replyDoc.data().created_at?.toDate().toISOString(),
          updated_at: replyDoc.data().updated_at?.toDate().toISOString(),
        }));
        
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate().toISOString(),
          updated_at: data.updated_at?.toDate().toISOString(),
          replies,
        };
      })
    );
    
    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error("GET /api/events/[id]/comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await apiRequirePermission("create:comment");
    const { id } = params;
    const { content, parent_id } = await req.json();
    
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Коментарът не може да бъде празен" },
        { status: 400 }
      );
    }
    
    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Коментарът е твърде дълъг (макс 2000 символа)" },
        { status: 400 }
      );
    }
    
    const commentData = {
      resource_type: "event",
      resource_id: id,
      parent_id: parent_id || null,
      author_id: user.uid,
      author_name: user.displayName || user.email,
      author_email: user.email,
      content: content.trim(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const docRef = await adminDb.collection("comments").add(commentData);
    
    await adminDb.collection("events").doc(id).update({
      comments_count: adminDb.FieldValue.increment(1),
    });
    
    return NextResponse.json({
      comment: {
        id: docRef.id,
        ...commentData,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/events/[id]/comments error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

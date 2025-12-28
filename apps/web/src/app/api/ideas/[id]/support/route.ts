import { NextRequest, NextResponse } from "next/server";
import { apiRequirePermission } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await apiRequirePermission("support:idea");
    const { id } = params;
    
    const ideaRef = adminDb.collection("ideas").doc(id);
    const supportRef = adminDb.collection("idea_supporters").doc(`${id}_${user.uid}`);
    
    const supportDoc = await supportRef.get();
    
    if (supportDoc.exists) {
      // Remove support
      await supportRef.delete();
      await ideaRef.update({
        supporters: adminDb.FieldValue.increment(-1),
      });
      
      return NextResponse.json({ supported: false });
    } else {
      // Add support
      await supportRef.set({
        idea_id: id,
        user_id: user.uid,
        created_at: new Date(),
      });
      
      await ideaRef.update({
        supporters: adminDb.FieldValue.increment(1),
      });
      
      return NextResponse.json({ supported: true });
    }
  } catch (error: any) {
    console.error("POST /api/ideas/[id]/support error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

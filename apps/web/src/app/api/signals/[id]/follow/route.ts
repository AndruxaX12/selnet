import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    
    const followRef = adminDb.collection("signal_followers").doc(`${id}_${user.uid}`);
    const followDoc = await followRef.get();
    
    if (followDoc.exists) {
      // Unfollow
      await followRef.delete();
      await adminDb.collection("signals").doc(id).update({
        watchers: adminDb.FieldValue.increment(-1),
      });
      
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await followRef.set({
        signal_id: id,
        user_id: user.uid,
        created_at: new Date(),
      });
      
      await adminDb.collection("signals").doc(id).update({
        watchers: adminDb.FieldValue.increment(1),
      });
      
      return NextResponse.json({ following: true });
    }
  } catch (error: any) {
    console.error("POST /api/signals/[id]/follow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/auth/server-session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ following: false });
    }
    
    // Check if user follows this signal
    const followDoc = await adminDb
      .collection("signal_followers")
      .where("signalId", "==", id)
      .where("userId", "==", user.uid)
      .limit(1)
      .get();
    
    const following = !followDoc.empty;
    
    return NextResponse.json({ following });
    
  } catch (error) {
    console.error("Follow status error:", error);
    return NextResponse.json({ 
      following: false,
      error: "Internal server error" 
    }, { status: 500 });
  }
}

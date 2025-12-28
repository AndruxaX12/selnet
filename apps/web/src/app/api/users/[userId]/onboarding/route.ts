import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getSessionUser();
    const { userId } = params;
    const { districts, interests, channels } = await req.json();
    
    if (!user || user.uid !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await adminDb.collection("users").doc(userId).set({
      onboarding: {
        completed: true,
        districts: districts || [],
        interests: interests || [],
        channels: channels || {},
        completed_at: new Date(),
      },
      updated_at: new Date(),
    }, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/users/[userId]/onboarding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

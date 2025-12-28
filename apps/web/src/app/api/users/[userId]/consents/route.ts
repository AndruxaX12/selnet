import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getSessionUser();
    const { userId } = params;
    
    if (!user || user.uid !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const consentDoc = await adminDb.collection("user_consents").doc(userId).get();
    
    if (!consentDoc.exists) {
      return NextResponse.json({
        consents: {},
        updated_at: null,
      });
    }
    
    const data = consentDoc.data();
    
    return NextResponse.json({
      consents: data?.consents || {},
      updated_at: data?.updated_at?.toDate().toISOString(),
    });
  } catch (error: any) {
    console.error("GET /api/users/[userId]/consents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getSessionUser();
    const { userId } = params;
    const { consents } = await req.json();
    
    if (!user || user.uid !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const now = new Date();
    
    await adminDb.collection("user_consents").doc(userId).set({
      user_id: userId,
      consents,
      updated_at: now,
    }, { merge: true });
    
    return NextResponse.json({
      success: true,
      updated_at: now.toISOString(),
    });
  } catch (error: any) {
    console.error("POST /api/users/[userId]/consents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

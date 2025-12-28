import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { guard } from "../_guard";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const auth = await guard(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const snapshot = await adminDb
      .collection("invites")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    
    const invites = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt || Date.now(),
        createdBy: data.createdBy || { id: "system", email: "system" },
        expiresAt: data.expiresAt,
        acceptedAt: data.acceptedAt,
        rejectedAt: data.rejectedAt,
        note: data.note,
      };
    });
    
    return NextResponse.json({ invites });
  } catch (error: any) {
    console.error("GET /api/admin/invites error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await guard(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { email, role, note } = await req.json();
    
    if (!email || !role) {
      return NextResponse.json(
        { error: "Email и role са задължителни" },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await adminDb
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();
    
    if (!existingUser.empty) {
      return NextResponse.json(
        { error: "Потребител с този email вече съществува" },
        { status: 400 }
      );
    }
    
    // Generate invite token
    const token = crypto.randomBytes(32).toString("hex");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003";
    const inviteUrl = `${baseUrl}/invites/accept?token=${token}`;
    
    // Expires in 7 days
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    
    // Save invite
    const inviteRef = await adminDb.collection("invites").add({
      email,
      role,
      token,
      inviteUrl,
      createdAt: Date.now(),
      createdBy: {
        id: auth.uid,
        email: auth.email || "unknown",
      },
      expiresAt,
      status: "pending",
      note: note || "",
    });
    
    // TODO: Send email with invite link
    console.log(`Invite sent to ${email}: ${inviteUrl}`);
    
    const inviteDoc = await inviteRef.get();
    const inviteData = inviteDoc.data();
    
    return NextResponse.json({
      invite: {
        id: inviteRef.id,
        ...inviteData,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/invites error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

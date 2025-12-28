import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const prefsDoc = await adminDb
      .collection("notification_prefs")
      .doc(userId)
      .get();

    if (!prefsDoc.exists) {
      // Return defaults
      return NextResponse.json({
        channels: {
          system: { inapp: true, email: true, push: false },
          signals: { inapp: true, email: false, push: true },
          ideas: { inapp: true, email: false, push: false },
          events: { inapp: true, email: true, push: true }
        },
        digest: {
          daily: null,
          weekly: null,
          monthly: null
        },
        quiet_hours: {
          enabled: false,
          from: "22:00",
          to: "07:00"
        }
      });
    }

    return NextResponse.json(prefsDoc.data());
  } catch (error: any) {
    console.error("GET /api/me/notification-prefs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;
    const body = await req.json();

    await adminDb
      .collection("notification_prefs")
      .doc(userId)
      .set(body, { merge: true });

    return NextResponse.json({
      success: true,
      prefs: body
    });
  } catch (error: any) {
    console.error("PUT /api/me/notification-prefs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

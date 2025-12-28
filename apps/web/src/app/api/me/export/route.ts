import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    // Check rate limit (max 2/day)
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    const recentExports = await adminDb
      .collection("exports")
      .where("user_id", "==", userId)
      .where("requested_at", ">=", yesterday)
      .get();

    if (recentExports.size >= 2) {
      return NextResponse.json(
        { error: "Максимум 2 експорта на ден" },
        { status: 429 }
      );
    }

    // Create export request
    const exportRef = await adminDb.collection("exports").add({
      user_id: userId,
      status: "pending",
      requested_at: Date.now(),
      ready_at: null,
      expires_at: null,
      url: null
    });

    // Start background export job
    await generateExport(userId, exportRef.id);

    return NextResponse.json({
      export_id: exportRef.id,
      status: "pending",
      requested_at: Date.now()
    }, { status: 202 });
  } catch (error: any) {
    console.error("POST /api/me/export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateExport(userId: string, exportId: string) {
  try {
    // Gather all user data
    const [userDoc, signals, ideas, events, comments] = await Promise.all([
      adminDb.collection("users").doc(userId).get(),
      adminDb.collection("signals").where("userId", "==", userId).get(),
      adminDb.collection("ideas").where("userId", "==", userId).get(),
      adminDb.collection("events").where("attendees", "array-contains", userId).get(),
      adminDb.collection("comments").where("userId", "==", userId).get()
    ]);

    const exportData = {
      export_info: {
        generated_at: new Date().toISOString(),
        user_id: userId,
        format: "JSON"
      },
      profile: userDoc.data(),
      signals: signals.docs.map(d => ({ id: d.id, ...d.data() })),
      ideas: ideas.docs.map(d => ({ id: d.id, ...d.data() })),
      events: events.docs.map(d => ({ id: d.id, ...d.data() })),
      comments: comments.docs.map(d => ({ id: d.id, ...d.data() }))
    };

    // In production, upload to Cloud Storage
    // For now, store inline (not recommended for large exports)
    const dataString = JSON.stringify(exportData, null, 2);
    
    // Update export status
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    await adminDb.collection("exports").doc(exportId).update({
      status: "ready",
      ready_at: Date.now(),
      expires_at: expiresAt,
      data: dataString,
      size_bytes: Buffer.byteLength(dataString, 'utf8')
    });

    console.log(`Export ${exportId} ready for user ${userId}`);
  } catch (error) {
    console.error("Export generation failed:", error);
    await adminDb.collection("exports").doc(exportId).update({
      status: "failed",
      error: (error as Error).message
    });
  }
}

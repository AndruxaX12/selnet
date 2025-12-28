import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireModerator } from "@/lib/admin-guard";
import { FieldValue } from "firebase-admin/firestore";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = params;
  const { fileUrl } = await req.json();

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
  }

  try {
    const signalRef = adminDb.collection("signals").doc(id);
    const doc = await signalRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    const data = doc.data();
    const media = data?.media || [];

    // Find the media item to remove
    // Assuming media is an array of objects { url: string, ... } or strings
    const newMedia = media.filter((m: any) => (typeof m === 'string' ? m : m.url) !== fileUrl);

    if (newMedia.length === media.length) {
      return NextResponse.json({ error: "File not found in signal" }, { status: 404 });
    }

    await signalRef.update({
      media: newMedia,
      media_count: newMedia.length
    });

    // Optionally log the action
    await adminDb.collection("system_logs").add({
      action: "MEDIA_DELETED",
      targetSignalId: id,
      fileUrl,
      performedBy: auth.uid,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/signals/[id]/media error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

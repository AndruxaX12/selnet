import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireModerator } from "@/lib/admin-guard";
import { logAction } from "@/lib/admin/audit";
import { sendNotificationToUser } from "@/lib/admin/notify";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = params;

  try {
    // 1. Get Signal
    const signalDoc = await adminDb.collection("signals").doc(id).get();
    if (!signalDoc.exists) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }
    const signal = { id: signalDoc.id, ...signalDoc.data() };

    // 2. Get Comments & Notes
    const commentsSnapshot = await adminDb.collection("comments")
      .where("resource_id", "==", id)
      .orderBy("createdAt", "desc")
      .get();
      
    const comments = commentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3. Get History
    const historySnapshot = await adminDb.collection("history")
      .where("resourceId", "==", id)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
      
    const history = historySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      signal,
      comments,
      history
    });
  } catch (error: any) {
    console.error("GET /api/admin/signals/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = params;

  try {
    await adminDb.collection("signals").doc(id).delete();
    
    await logAction(
      auth.uid || "",
      auth.email || "unknown",
      "Deleted signal",
      "signal_delete",
      `Signal ID: ${id}`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/signals/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = params;
  const body = await req.json();
  const { status, comment, publicComment, internalNote, images } = body;

  let signalAuthorId: string | null = null;
  let signalTitle: string = "";

  try {
    const signalRef = adminDb.collection("signals").doc(id);
    
    await adminDb.runTransaction(async (t) => {
      const doc = await t.get(signalRef);
      if (!doc.exists) throw new Error("Signal not found");
      
      const data = doc.data();
      signalAuthorId = data?.authorId;
      signalTitle = data?.title || "Сигнал";

      const updates: any = {};
      if (status) {
        updates.status = status;
        updates.updatedAt = Date.now();
        // Add statusComment for the trigger to pick up
        if (comment) updates.statusComment = comment;
      }

      if (images && Array.isArray(images)) {
        updates.images = images;
      }
      
      t.update(signalRef, updates);

      // Add comment if provided
      if (comment || publicComment) {
        const commentRef = adminDb.collection("comments").doc();
        t.set(commentRef, {
          resource_id: id,
          resource_type: "signal",
          author_id: auth.uid, // Admin/Operator ID
          author_name: "Администратор", // Should get real name
          body: comment || publicComment,
          createdAt: Date.now(),
          type: "comment", // Standard comment
          is_admin: true
        });
      }

      // Add internal note if provided
      if (internalNote) {
        const noteRef = adminDb.collection("comments").doc();
        t.set(noteRef, {
          resource_id: id,
          resource_type: "signal",
          author_id: auth.uid,
          author_name: "Администратор (Вътрешна бележка)",
          body: internalNote,
          createdAt: Date.now(),
          type: "internal_note",
          is_admin: true
        });
      }
    });

    // Audit Log
    if (status) {
        await logAction(
            auth.uid || "", 
            auth.email || "unknown", 
            `Updated signal status to ${status}`, 
            "signal_update", 
            `Signal ID: ${id}. Comment: ${comment || ""}`, 
            id
        );

        // Notify User
        if (signalAuthorId) {
            try {
                const statusLabels: Record<string, string> = {
                    approved: "Одобрен",
                    in_progress: "В работа",
                    resolved: "Решен",
                    rejected: "Отхвърлен"
                };
                const label = statusLabels[status] || status;
                
                await sendNotificationToUser(signalAuthorId, {
                    title: "Промяна в статуса на сигнал",
                    body: `Вашият сигнал "${signalTitle}" беше променен на статус "${label}". ${comment ? `Коментар: ${comment}` : ""}`,
                    type: "signal",
                    link: `/signals/${id}`,
                    icon: "info"
                });
            } catch (notifyError) {
                console.error("Failed to send notification:", notifyError);
                // Don't fail the request if notification fails
            }
        }
    }
    if (internalNote) {
        await logAction(
            auth.uid || "", 
            auth.email || "unknown", 
            "Added internal note", 
            "signal_update", 
            `Signal ID: ${id}. Note: ${internalNote}`, 
            id
        );
    }

    if (images) {
        await logAction(
            auth.uid || "", 
            auth.email || "unknown", 
            "Updated signal images", 
            "signal_update", 
            `Signal ID: ${id}. Images count: ${images.length}`, 
            id
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/admin/signals/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

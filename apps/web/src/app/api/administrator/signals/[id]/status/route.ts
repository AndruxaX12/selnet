import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Allowed statuses for administrator
const ALLOWED_STATUSES = new Set(["novo", "v_process", "zavarsheno", "otxvarleno"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authorization from header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { status, userId, userRole } = body;

    // Validate status
    if (!status || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid status. Allowed: novo, v_process, zavarsheno, otxvarleno" },
        { status: 400 }
      );
    }

    // Check role
    if (!userRole || !["ADMINISTRATOR", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden - requires ADMINISTRATOR or ADMIN role" }, { status: 403 });
    }

    const signalId = params.id;
    const ref = adminDb.collection("signals").doc(signalId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    const oldStatus = snap.data()?.status;

    // Update signal status
    await ref.update({
      status,
      updatedAt: Date.now(),
      lastStatusChange: {
        from: oldStatus,
        to: status,
        changedBy: userId,
        changedAt: Date.now()
      }
    });

    // Add to history
    await ref.collection("history").add({
      at: Date.now(),
      by: userId,
      action: "status_change",
      from: oldStatus,
      to: status,
      text: `Статус сменен от "${oldStatus}" на "${status}"`
    });

    return NextResponse.json({
      ok: true,
      signalId,
      oldStatus,
      newStatus: status
    });
  } catch (error: any) {
    console.error("Error updating signal status:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

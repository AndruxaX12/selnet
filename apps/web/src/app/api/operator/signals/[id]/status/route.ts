import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { STATUS_TRANSITIONS } from "@/lib/operator/constants";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const roles = (decoded.roles as string[]) || [];
    
    const hasAccess = roles.includes("operator") || roles.includes("admin");
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const signalId = params.id;
    const body = await req.json();
    const { to, reason, evidence } = body;

    // Validate transition
    if (!to) {
      return NextResponse.json({ error: "Missing 'to' status" }, { status: 400 });
    }

    // Require reason for rejection
    if (to === "otkhvurlen" && !reason) {
      return NextResponse.json(
        { error: "Reason required for rejection" },
        { status: 400 }
      );
    }

    // Require evidence for fixed status
    if (to === "popraven" && !evidence) {
      return NextResponse.json(
        { error: "Evidence required for fixed status" },
        { status: 400 }
      );
    }

    // Check If-Match header for concurrency control
    const ifMatch = req.headers.get("if-match");
    if (ifMatch) {
      // In production, verify ETag matches current version
      // If mismatch, return 412 Precondition Failed
      // For now, we'll skip this check in mock
    }

    // Mock update
    console.log(`Updating signal ${signalId} status to ${to}`);
    if (reason) console.log(`Reason: ${reason}`);

    const updated = {
      id: signalId,
      status: to,
      updated_at: new Date().toISOString(),
      ...(to === "potvurden" && { confirmed_at: new Date().toISOString() }),
      ...(to === "v_proces" && { in_process_at: new Date().toISOString() }),
      ...(to === "popraven" && { resolved_at: new Date().toISOString() }),
      ...(to === "otkhvurlen" && { rejected_at: new Date().toISOString(), reject_reason: reason })
    };

    // Generate new ETag
    const newEtag = `"${Date.now()}"`;

    return NextResponse.json(updated, {
      headers: {
        "ETag": newEtag
      }
    });
  } catch (error: any) {
    console.error("PATCH /api/operator/signals/:id/status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

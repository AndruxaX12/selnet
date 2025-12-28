import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";

// GET /api/admin/approvals - List pending approval requests
export async function GET(req: NextRequest) {
  try {
    const admin = await apiRequireRole(["admin"]);
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    
    let query = adminDb.collection("approval_requests");
    
    if (status !== "all") {
      query = query.where("status", "==", status) as any;
    }
    
    const snapshot = await query
      .orderBy("created_at", "desc")
      .limit(50)
      .get();
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate().toISOString(),
      approved_at: doc.data().approved_at?.toDate().toISOString(),
      rejected_at: doc.data().rejected_at?.toDate().toISOString()
    }));
    
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("GET /api/admin/approvals error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/approvals - Create new approval request
export async function POST(req: NextRequest) {
  try {
    const admin = await apiRequireRole(["admin"]);
    const body = await req.json();
    
    const {
      type,
      action,
      target_user_id,
      target_user_email,
      role,
      scope,
      reason
    } = body;
    
    // Validate required fields
    if (!type || !action || !target_user_id || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create approval request
    const approvalRef = await adminDb.collection("approval_requests").add({
      type,
      action,
      target_user_id,
      target_user_email,
      role,
      scope: scope || null,
      reason,
      status: "pending",
      requested_by: admin.uid,
      requested_by_email: admin.email,
      created_at: new Date()
    });
    
    // Log audit event
    await adminDb.collection("audit_logs").add({
      event: "admin.approval.requested",
      timestamp: new Date(),
      actor: {
        id: admin.uid,
        email: admin.email,
        roles: admin.roles || []
      },
      target: {
        type: "approval_request",
        id: approvalRef.id
      },
      details: {
        approval_type: type,
        action,
        target_user_id,
        role,
        reason
      },
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      user_agent: req.headers.get("user-agent")
    });
    
    // Notify other admins about pending approval
    try {
      // Get all admin emails except the requester
      const adminsSnapshot = await adminDb
        .collection("users")
        .where("roles", "array-contains", "admin")
        .get();
      
      const adminEmails = adminsSnapshot.docs
        .map(doc => doc.data().email)
        .filter((email: string) => email && email !== admin.email);
      
      if (adminEmails.length > 0) {
        const { notifyApprovalRequest } = await import("@/lib/email/send");
        await notifyApprovalRequest({
          adminEmails,
          requesterEmail: admin.email || "admin@selnet.bg",
          targetUserEmail: target_user_email || target_user_id,
          role,
          reason,
          requestId: approvalRef.id
        });
      }
    } catch (emailError) {
      console.error("Approval notification email error:", emailError);
      // Don't fail the request if email fails
    }
    
    return NextResponse.json({
      request_id: approvalRef.id,
      status: "pending_approval"
    }, { status: 202 });
  } catch (error: any) {
    console.error("POST /api/admin/approvals error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

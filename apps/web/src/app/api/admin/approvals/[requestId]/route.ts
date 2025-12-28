import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole } from "@/lib/auth/rbac";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// POST /api/admin/approvals/:requestId - Approve or reject
export async function POST(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const admin = await apiRequireRole(["admin"]);
    const { requestId } = params;
    const { decision, reason } = await req.json();
    
    if (!decision || !["approve", "reject"].includes(decision)) {
      return NextResponse.json(
        { error: "Invalid decision. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }
    
    // Get approval request
    const requestRef = adminDb.collection("approval_requests").doc(requestId);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: "Approval request not found" },
        { status: 404 }
      );
    }
    
    const requestData = requestDoc.data();
    
    if (requestData?.status !== "pending") {
      return NextResponse.json(
        { error: "Approval request already processed" },
        { status: 400 }
      );
    }
    
    // Cannot approve own request
    if (requestData?.requested_by === admin.uid) {
      return NextResponse.json(
        { error: "Не можеш да одобриш собствената си заявка" },
        { status: 403 }
      );
    }
    
    if (decision === "approve") {
      // Execute the approved action
      const { target_user_id, role, scope, action } = requestData;
      
      if (action === "grant_role") {
        // Get user
        const userRef = adminDb.collection("users").doc(target_user_id);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          return NextResponse.json(
            { error: "Target user not found" },
            { status: 404 }
          );
        }
        
        const userData = userDoc.data();
        const currentRoles = userData?.roles || [];
        const newRoles = [...currentRoles, role];
        
        // Update user roles
        await userRef.update({
          roles: newRoles,
          updated_at: new Date(),
          updated_by: admin.uid
        });
        
        // Update Firebase Auth custom claims
        await adminAuth.setCustomUserClaims(target_user_id, {
          role: newRoles[0] || "citizen",
          roles: newRoles
        });
        
        // Create role grant record
        await adminDb.collection("role_grants").add({
          user_id: target_user_id,
          role,
          scope: scope || null,
          granted_by: admin.uid,
          granted_at: new Date(),
          reason: requestData.reason,
          status: "active",
          approved_by: admin.uid,
          approval_request_id: requestId
        });
        
        // Log audit
        await adminDb.collection("audit_logs").add({
          event: "role.granted",
          timestamp: new Date(),
          actor: {
            id: admin.uid,
            email: admin.email,
            roles: admin.roles || []
          },
          target: {
            type: "user",
            id: target_user_id,
            email: userData?.email
          },
          details: {
            role,
            scope: scope || null,
            reason: requestData.reason,
            approval_request_id: requestId,
            approved_by: admin.email
          },
          ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          user_agent: req.headers.get("user-agent")
        });
      }
      
      // Update approval request
      await requestRef.update({
        status: "approved",
        approved_by: admin.uid,
        approved_by_email: admin.email,
        approved_at: new Date(),
        approval_reason: reason
      });
      
      // Log approval audit
      await adminDb.collection("audit_logs").add({
        event: "admin.approval.approved",
        timestamp: new Date(),
        actor: {
          id: admin.uid,
          email: admin.email,
          roles: admin.roles || []
        },
        target: {
          type: "approval_request",
          id: requestId
        },
        details: {
          requested_by: requestData.requested_by_email,
          target_user_id: requestData.target_user_id,
          role: requestData.role,
          reason
        }
      });
      
      return NextResponse.json({
        status: "approved",
        message: "Заявката е одобрена и ролята е присвоена"
      });
    } else {
      // Reject
      await requestRef.update({
        status: "rejected",
        rejected_by: admin.uid,
        rejected_by_email: admin.email,
        rejected_at: new Date(),
        rejection_reason: reason
      });
      
      // Log rejection audit
      await adminDb.collection("audit_logs").add({
        event: "admin.approval.rejected",
        timestamp: new Date(),
        actor: {
          id: admin.uid,
          email: admin.email,
          roles: admin.roles || []
        },
        target: {
          type: "approval_request",
          id: requestId
        },
        details: {
          requested_by: requestData.requested_by_email,
          target_user_id: requestData.target_user_id,
          role: requestData.role,
          reason
        }
      });
      
      return NextResponse.json({
        status: "rejected",
        message: "Заявката е отхвърлена"
      });
    }
  } catch (error: any) {
    console.error("POST /api/admin/approvals/[requestId] error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

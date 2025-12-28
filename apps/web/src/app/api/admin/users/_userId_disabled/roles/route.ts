import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole } from "@/lib/auth/rbac";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { RoleKey } from "@/lib/auth/policies";

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await apiRequireRole(["admin"]);
    const { userId } = params;
    const { role, action, reason, scope, notify } = await req.json();
    
    if (!role || !action) {
      return NextResponse.json(
        { error: "Role и action са задължителни" },
        { status: 400 }
      );
    }
    
    // Validate reason (required)
    if (!reason || reason.length < 10) {
      return NextResponse.json(
        { error: "Причината е задължителна и трябва да е поне 10 символа" },
        { status: 400 }
      );
    }
    
    // Get user doc
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Потребителят не съществува" }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const currentRoles = userData?.roles || [];
    
    let newRoles: RoleKey[];
    
    if (action === "add") {
      if (currentRoles.includes(role)) {
        return NextResponse.json({ error: "Ролята вече е присвоена" }, { status: 400 });
      }
      newRoles = [...currentRoles, role];
    } else if (action === "remove") {
      newRoles = currentRoles.filter((r: string) => r !== role);
    } else {
      return NextResponse.json({ error: "Невалидно действие" }, { status: 400 });
    }
    
    // Update Firestore
    await userRef.update({
      roles: newRoles,
      updated_at: new Date(),
      updated_by: admin.uid,
    });
    
    // Update Firebase Auth custom claims
    await adminAuth.setCustomUserClaims(userId, {
      role: newRoles[0] || "citizen",
      roles: newRoles,
    });
    
    // Create role_grant record (for history)
    if (action === "add") {
      await adminDb.collection("role_grants").add({
        user_id: userId,
        role,
        scope: scope || null,
        granted_by: admin.uid,
        granted_at: new Date(),
        reason,
        status: "active"
      });
    }
    
    // Log audit with enhanced details
    await adminDb.collection("audit_logs").add({
      event: action === "add" ? "role.granted" : "role.revoked",
      timestamp: new Date(),
      actor: {
        id: admin.uid,
        email: admin.email,
        roles: admin.roles || []
      },
      target: {
        type: "user",
        id: userId,
        email: userData?.email
      },
      details: {
        role,
        scope: scope || null,
        reason,
        notify: notify !== false
      },
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      user_agent: req.headers.get("user-agent")
    });
    
    // Send email notification if requested
    if (notify !== false && userData?.email) {
      try {
        if (action === "add") {
          const { notifyRoleGranted } = await import("@/lib/email/send");
          await notifyRoleGranted({
            userEmail: userData.email,
            userName: userData.name,
            role,
            reason,
            adminEmail: admin.email || "admin@selnet.bg"
          });
        } else {
          const { notifyRoleRevoked } = await import("@/lib/email/send");
          await notifyRoleRevoked({
            userEmail: userData.email,
            userName: userData.name,
            role,
            reason,
            adminEmail: admin.email || "admin@selnet.bg"
          });
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
        // Don't fail the request if email fails
      }
    }
    
    return NextResponse.json({ success: true, roles: newRoles, reason });
  } catch (error: any) {
    console.error("POST /api/admin/users/[userId]/roles error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole } from "@/lib/auth/rbac";
import { adminDb } from "@/lib/firebase-admin";
import { can } from "@/lib/auth/policies";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await apiRequireRole(["admin"]);
    const { userId } = params;
    
    // Get user doc
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Потребителят не съществува" }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    // Get role grants
    const roleGrantsSnapshot = await adminDb
      .collection("role_grants")
      .where("user_id", "==", userId)
      .where("status", "==", "active")
      .get();
    
    const role_grants = roleGrantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      granted_at: doc.data().granted_at?.toDate().toISOString()
    }));
    
    // Calculate abilities
    const roles = userData?.roles || [];
    const abilities = [
      "read:list",
      "create:signal",
      "create:idea",
      "create:event",
      "moderate:signal",
      "moderate:idea",
      "moderate:comment",
      "signal:transition",
      "signal:verify",
      "manage:roles",
      "manage:invites",
      "view:audit"
    ].filter(action => can(roles, action as any));
    
    return NextResponse.json({
      user: {
        id: userDoc.id,
        ...userData,
        created_at: userData?.created_at?.toDate().toISOString(),
        last_login: userData?.last_login?.toDate().toISOString()
      },
      role_grants,
      abilities,
      admin_notes: userData?.admin_notes || ""
    });
  } catch (error: any) {
    console.error("GET /api/admin/users/[userId] error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

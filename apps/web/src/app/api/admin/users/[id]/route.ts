import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/rbac/middleware";
import { ROLES } from "@/lib/rbac/roles";
import { logAction } from "@/lib/admin/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(req, async (req, user) => {
    if (user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = params;
    try {
      // Try to get from Firestore first
      const userDoc = await adminDb.collection("users").doc(id).get();
      let userData = userDoc.exists ? userDoc.data() : {};

      // Try to get from Auth to get email if missing
      try {
        const authUser = await adminAuth.getUser(id);
        userData = {
            ...userData,
            email: authUser.email,
            displayName: authUser.displayName,
            photoURL: authUser.photoURL,
            disabled: authUser.disabled,
            lastSignInTime: authUser.metadata.lastSignInTime,
            creationTime: authUser.metadata.creationTime,
        };
      } catch (e) {
        // User might not exist in Auth if deleted or data mismatch
        console.warn(`User ${id} not found in Auth`);
      }

      return NextResponse.json({ user: { id, ...userData } });
    } catch (error: any) {
      console.error("GET /api/admin/users/[id] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(req, async (req, user) => {
    if (user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = params;
    try {
      const body = await req.json();
      const { role, disabled } = body;

      // Update Auth
      const updateData: any = {};
      if (typeof disabled === "boolean") updateData.disabled = disabled;
      // Note: customClaims (role) are updated via setCustomUserClaims
      
      if (Object.keys(updateData).length > 0) {
        await adminAuth.updateUser(id, updateData);
      }

      if (role) {
        await adminAuth.setCustomUserClaims(id, { role });
        // Sync with Firestore
        await adminDb.collection("users").doc(id).set({ role }, { merge: true });
      }
      
      if (typeof disabled === "boolean") {
         await adminDb.collection("users").doc(id).set({ disabled }, { merge: true });
      }

      // Audit Log
      await logAction(
        user.uid,
        user.email || "unknown",
        `Updated user: ${id}`,
        "user_update",
        `Role: ${role}, Disabled: ${disabled}`
      );

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("PUT /api/admin/users/[id] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(req, async (req, user) => {
    if (user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = params;
    try {
      await adminAuth.deleteUser(id);
      await adminDb.collection("users").doc(id).delete();

      // Audit Log
      await logAction(
        user.uid,
        user.email || "unknown",
        `Deleted user: ${id}`,
        "user_update",
        `User deleted`
      );

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("DELETE /api/admin/users/[id] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

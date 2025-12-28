import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { adminAuth, adminDb } from "@/lib/firebase/server";
import { ROLES } from "@/lib/rbac/roles";
import { SubscriptionModel } from "@/lib/models/Subscription";

/**
 * DELETE /api/profile/delete-account
 * Delete user account (only for USER role)
 */
export async function DELETE(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {
      const { uid, role } = user;

      // Only USER can delete their own account
      // ADMIN and MODERATOR must be removed by another ADMIN
      if (role !== ROLES.USER) {
        return NextResponse.json(
          {
            error: "Only regular users can delete their own account",
            message: "Администратори и модератори не могат да изтрият собствените си акаунти",
          },
          { status: 403 }
        );
      }

      // Delete user's subscription
      await SubscriptionModel.delete(uid);

      // Delete user's signals (mark as deleted or transfer to anonymous)
      const signalsSnapshot = await adminDb
        .collection("signals")
        .where("userId", "==", uid)
        .get();

      const batch = adminDb.batch();
      signalsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          userId: "deleted-user",
          userDeleted: true,
          deletedAt: new Date().toISOString(),
        });
      });
      await batch.commit();

      // Delete user document from Firestore
      await adminDb.collection("users").doc(uid).delete();

      // Delete user from Firebase Auth
      await adminAuth.deleteUser(uid);

      return NextResponse.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete account error:", error);
      return NextResponse.json(
        { error: "Failed to delete account", details: error.message },
        { status: 500 }
      );
    }
  });
}

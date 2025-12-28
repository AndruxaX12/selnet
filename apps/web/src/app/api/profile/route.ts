import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { adminDb, adminAuth } from "@/lib/firebase/server";

/**
 * GET /api/profile
 * Get current user's profile data
 */
export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {
      const { uid } = user;

    // Get user from Firebase Auth
    const userRecord = await adminAuth.getUser(uid);

    // Get additional data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data() || {};

    // Get custom claims (role)
    const customClaims = userRecord.customClaims || {};
    const role = customClaims.role || "USER";

    // Count user's signals
    const signalsSnapshot = await adminDb
      .collection("signals")
      .where("userId", "==", uid)
      .count()
      .get();

    const profile = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || userData.displayName || "",
      photoURL: userRecord.photoURL || userData.photoURL || "",
      phoneNumber: userRecord.phoneNumber || userData.phoneNumber || "",
      role: role,
      createdAt: userRecord.metadata.creationTime,
      signalsCount: signalsSnapshot.data().count,
      
      // Location fields
      city: userData.city || "",
      street: userData.street || "",
      
      // Notification settings
      notificationsEnabled: userData.notificationsEnabled ?? true,
      
      // Additional metadata
      lastSignInTime: userRecord.metadata.lastSignInTime,
    };

      return NextResponse.json(profile);
    } catch (error: any) {
      console.error("Get profile error:", error);
      return NextResponse.json(
        { error: "Failed to get profile", details: error.message },
        { status: 500 }
      );
    }
  });
}

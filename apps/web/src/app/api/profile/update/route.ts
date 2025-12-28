import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { adminDb, adminAuth } from "@/lib/firebase/server";

/**
 * PUT /api/profile/update
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {
      const { uid } = user;
      console.log("🔄 Update profile for user:", uid);
      
      const body = await req.json();
      console.log("📥 Request body:", body);

      const {
        displayName,
        photoURL,
        phoneNumber,
        city,
        street,
      } = body;

      // Update Firebase Auth profile
      const authUpdates: any = {};
      if (displayName !== undefined) authUpdates.displayName = displayName;
      
      // Only update photoURL in Firebase Auth if it's a valid HTTP(S) URL
      // Base64 images should only be stored in Firestore
      if (photoURL !== undefined && photoURL && (photoURL.startsWith('http://') || photoURL.startsWith('https://'))) {
        authUpdates.photoURL = photoURL;
      }
      
      // Phone number must be null or valid E.164 format (not empty string)
      if (phoneNumber !== undefined) {
        if (phoneNumber && phoneNumber.trim() !== "") {
          // Only set if not empty - Firebase will validate E.164 format
          authUpdates.phoneNumber = phoneNumber.trim();
        } else {
          // Set to null to clear phone number
          authUpdates.phoneNumber = null;
        }
      }

      if (Object.keys(authUpdates).length > 0) {
        console.log("🔐 Updating Firebase Auth with:", authUpdates);
        try {
          await adminAuth.updateUser(uid, authUpdates);
          console.log("✅ Firebase Auth updated successfully");
        } catch (authError: any) {
          console.error("❌ Firebase Auth update failed:", authError);
          throw new Error(`Auth update failed: ${authError.message}`);
        }
      }

      // Update Firestore user document
      const firestoreUpdates: any = {};
      if (displayName !== undefined) firestoreUpdates.displayName = displayName;
      if (photoURL !== undefined) firestoreUpdates.photoURL = photoURL;
      if (phoneNumber !== undefined) firestoreUpdates.phoneNumber = phoneNumber;
      if (city !== undefined) firestoreUpdates.city = city;
      if (street !== undefined) firestoreUpdates.street = street;
      firestoreUpdates.updatedAt = new Date().toISOString();

      console.log("📝 Updating Firestore with:", firestoreUpdates);
      try {
        await adminDb
          .collection("users")
          .doc(uid)
          .set(firestoreUpdates, { merge: true });
        console.log("✅ Firestore updated successfully");
      } catch (firestoreError: any) {
        console.error("❌ Firestore update failed:", firestoreError);
        throw new Error(`Firestore update failed: ${firestoreError.message}`);
      }

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("❌ Update profile error:", error);
      console.error("Error stack:", error.stack);
      return NextResponse.json(
        { 
          error: "Failed to update profile", 
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  });
}

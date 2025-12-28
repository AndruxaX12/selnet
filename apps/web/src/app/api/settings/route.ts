import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { adminDb } from "@/lib/firebase/server";

/**
 * GET /api/settings
 * Get user's settings
 */
export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {
      const { uid, role } = user;

      // Get user document from Firestore
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const userData = userDoc.data() || {};

      const settings = {
        // Notification settings
        notificationsEnabled: userData.notificationsEnabled ?? true,
        
        // Location
        city: userData.city || "",
        street: userData.street || "",
        
        // User preferences
        language: userData.language || "bg",
        
        // Role-specific data
        role: role,
        
        // Metadata
        updatedAt: userData.updatedAt || null,
      };

      return NextResponse.json(settings);
    } catch (error: any) {
      console.error("Get settings error:", error);
      return NextResponse.json(
        { error: "Failed to get settings", details: error.message },
        { status: 500 }
      );
    }
  });
}

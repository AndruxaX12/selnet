import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { adminDb } from "@/lib/firebase/server";

/**
 * PUT /api/settings/update
 * Update user's settings
 */
export async function PUT(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {
      const { uid } = user;
      const body = await req.json();

      const {
        notificationsEnabled,
        language,
      } = body;

      // Build update object
      const updates: any = {
        updatedAt: new Date().toISOString(),
      };

      if (notificationsEnabled !== undefined) {
        updates.notificationsEnabled = notificationsEnabled;
      }

      if (language !== undefined) {
        updates.language = language;
      }

      // Update user document
      await adminDb
        .collection("users")
        .doc(uid)
        .set(updates, { merge: true });

      return NextResponse.json({
        success: true,
        message: "Settings updated successfully",
      });
    } catch (error: any) {
      console.error("Update settings error:", error);
      return NextResponse.json(
        { error: "Failed to update settings", details: error.message },
        { status: 500 }
      );
    }
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { adminDb } from "@/lib/firebase/server";
import { SubscriptionModel } from "@/lib/models/Subscription";

/**
 * PUT /api/profile/update-location
 * Update user's location and subscription settings
 */
export async function PUT(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {
      const { uid } = user;
      const body = await req.json();

      const {
        city,
        street,
        receiveCityAlerts,
        receiveStreetAlerts,
      } = body;

      // Validate required field
      if (!city) {
        return NextResponse.json(
          { error: "City is required" },
          { status: 400 }
        );
      }

      // Update user document in Firestore
      await adminDb
        .collection("users")
        .doc(uid)
        .set(
          {
            city,
            street: street || "",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

      // Update or create subscription
      await SubscriptionModel.upsert(uid, {
        city,
        street: street || "",
        receiveCityAlerts: receiveCityAlerts ?? true,
        receiveStreetAlerts: receiveStreetAlerts ?? false,
      });

      return NextResponse.json({
        success: true,
        message: "Location updated successfully",
      });
    } catch (error: any) {
      console.error("Update location error:", error);
      return NextResponse.json(
        { error: "Failed to update location", details: error.message },
        { status: 500 }
      );
    }
  });
}

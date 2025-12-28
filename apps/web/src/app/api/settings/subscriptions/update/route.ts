import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { SubscriptionModel } from "@/lib/models/Subscription";
import { adminDb } from "@/lib/firebase/server";

/**
 * PUT /api/settings/subscriptions/update
 * Update user's push notification subscriptions
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

      // Validate city is provided
      if (!city) {
        return NextResponse.json(
          { error: "City is required for subscriptions" },
          { status: 400 }
        );
      }

      // Update subscription
      await SubscriptionModel.upsert(uid, {
        city,
        street: street || "",
        receiveCityAlerts: receiveCityAlerts ?? true,
        receiveStreetAlerts: receiveStreetAlerts ?? false,
      });

      // Also update user document to keep city/street in sync
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

      return NextResponse.json({
        success: true,
        message: "Subscriptions updated successfully",
      });
    } catch (error: any) {
      console.error("Update subscriptions error:", error);
      return NextResponse.json(
        { error: "Failed to update subscriptions", details: error.message },
        { status: 500 }
      );
    }
  });
}

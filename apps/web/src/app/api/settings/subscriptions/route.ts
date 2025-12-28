import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";
import { SubscriptionModel } from "@/lib/models/Subscription";

/**
 * GET /api/settings/subscriptions
 * Get user's push notification subscriptions
 */
export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {
      const { uid } = user;

      const subscription = await SubscriptionModel.getByUserId(uid);

      if (!subscription) {
        return NextResponse.json({
          city: "",
          street: "",
          receiveCityAlerts: true,
          receiveStreetAlerts: false,
        });
      }

      return NextResponse.json({
        city: subscription.city,
        street: subscription.street || "",
        receiveCityAlerts: subscription.receiveCityAlerts,
        receiveStreetAlerts: subscription.receiveStreetAlerts,
      });
    } catch (error: any) {
      console.error("Get subscriptions error:", error);
      return NextResponse.json(
        { error: "Failed to get subscriptions", details: error.message },
        { status: 500 }
      );
    }
  });
}

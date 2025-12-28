import { adminDb } from "@/lib/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

export interface Subscription {
  id?: string;
  userId: string;
  city: string;
  street?: string;
  receiveCityAlerts: boolean;
  receiveStreetAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

export class SubscriptionModel {
  private static collection = "subscriptions";

  /**
   * Get user's subscription settings
   */
  static async getByUserId(userId: string): Promise<Subscription | null> {
    try {
      const snapshot = await adminDb
        .collection(this.collection)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Subscription;
    } catch (error) {
      console.error("Error getting subscription:", error);
      throw error;
    }
  }

  /**
   * Create or update user's subscription
   */
  static async upsert(
    userId: string,
    data: Partial<Omit<Subscription, "id" | "userId" | "createdAt">>
  ): Promise<Subscription> {
    try {
      const existing = await this.getByUserId(userId);

      const now = new Date().toISOString();

      if (existing && existing.id) {
        // Update existing
        await adminDb
          .collection(this.collection)
          .doc(existing.id)
          .update({
            ...data,
            updatedAt: now,
          });

        return {
          ...existing,
          ...data,
          updatedAt: now,
        } as Subscription;
      } else {
        // Create new
        const subscriptionData: Omit<Subscription, "id"> = {
          userId,
          city: data.city || "",
          street: data.street || "",
          receiveCityAlerts: data.receiveCityAlerts ?? true,
          receiveStreetAlerts: data.receiveStreetAlerts ?? false,
          createdAt: now,
          updatedAt: now,
        };

        const docRef = await adminDb
          .collection(this.collection)
          .add(subscriptionData);

        return {
          id: docRef.id,
          ...subscriptionData,
        };
      }
    } catch (error) {
      console.error("Error upserting subscription:", error);
      throw error;
    }
  }

  /**
   * Get all subscriptions for a city
   */
  static async getByCityAlert(city: string): Promise<Subscription[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collection)
        .where("city", "==", city)
        .where("receiveCityAlerts", "==", true)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Subscription[];
    } catch (error) {
      console.error("Error getting city subscriptions:", error);
      throw error;
    }
  }

  /**
   * Get all subscriptions for a specific street
   */
  static async getByStreetAlert(
    city: string,
    street: string
  ): Promise<Subscription[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collection)
        .where("city", "==", city)
        .where("street", "==", street)
        .where("receiveStreetAlerts", "==", true)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Subscription[];
    } catch (error) {
      console.error("Error getting street subscriptions:", error);
      throw error;
    }
  }

  /**
   * Delete subscription
   */
  static async delete(userId: string): Promise<void> {
    try {
      const existing = await this.getByUserId(userId);
      if (existing && existing.id) {
        await adminDb.collection(this.collection).doc(existing.id).delete();
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);
      throw error;
    }
  }
}

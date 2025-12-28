import { getFirestore } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";

function getDb() {
  if (getApps().length === 0) {
    try { initializeApp(); } catch {}
  }
  return getFirestore();
}

export async function sendNotificationToUser(
    userId: string,
    notification: {
        title: string;
        body: string;
        type: "system" | "signal" | "idea" | "event";
        link?: string;
        icon?: string;
    }
) {
  if (!userId) return;
  try {
    const db = getDb();
    await db.collection("users").doc(userId).collection("inbox").add({
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`Failed to send notification to user ${userId}:`, error);
  }
}

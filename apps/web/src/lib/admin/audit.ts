import { getFirestore } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";

function getDb() {
  if (getApps().length === 0) {
    try { initializeApp(); } catch {}
  }
  return getFirestore();
}

export async function logAction(
    actorId: string, 
    actorEmail: string, 
    action: string, 
    actionType: "signal_update" | "user_update" | "page_update" | "system" | "communication", 
    details: string,
    targetId?: string
) {
  try {
    const db = getDb();
    await db.collection("audit_logs").add({
      actorId,
      actorEmail,
      action,
      actionType,
      details,
      targetId: targetId || null,
      createdAt: new Date(),
      // ip could be passed if we extracted it from request headers
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

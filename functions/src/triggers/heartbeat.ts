import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const db = admin.firestore();

export const heartbeat = functions.pubsub.schedule("every 5 minutes").onRun(async () => {
  await db.collection("telemetry").doc("heartbeat").set({ ts: Date.now() }, { merge: true });
  console.log("Heartbeat updated");
});

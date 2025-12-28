import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

type Config = {
  coll: "signals" | "ideas" | "events";
  hours: number;
};

const CONFIG: Config[] = [
  { coll: "signals", hours: 48 },
  { coll: "ideas", hours: 72 },
  { coll: "events", hours: 24 }
];

export const slaEscalate = functions.pubsub.schedule("every 1 hours").onRun(async () => {
  const now = Date.now();

  for (const { coll, hours } of CONFIG) {
    const cutoff = now - hours * 3600 * 1000;
    const snap = await db
      .collection(coll)
      .where("status", "in", ["new", "triaged"])
      .where("createdAt", "<=", cutoff)
      .get();

    if (snap.empty) continue;

    const batch = db.batch();
    snap.docs.forEach((docSnap: QueryDocumentSnapshot) => {
      const ref = docSnap.ref;
      batch.update(ref, {
        escalated: true,
        escalatedAt: now
      });
      batch.create(ref.collection("history").doc(), {
        at: now,
        by: "system",
        action: "escalate"
      });
    });

    await batch.commit();
  }

  return null;
});

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const db = admin.firestore();

export const onRSVPWrite = functions.firestore
  .document("events/{id}/rsvp/{uid}")
  .onWrite(async (change, ctx) => {
    const id = ctx.params.id as string;
    const before = change.before.exists ? (change.before.data() as any).v : null;
    const after  = change.after.exists ? (change.after.data() as any).v : null;

    let goingDelta = 0, interestedDelta = 0;
    if (before === "going" && after !== "going") goingDelta--;
    if (before !== "going" && after === "going") goingDelta++;
    if (before === "interested" && after !== "interested") interestedDelta--;
    if (before !== "interested" && after === "interested") interestedDelta++;

    if (!goingDelta && !interestedDelta) return;

    await db.collection("events").doc(id).update({
      goingCount: admin.firestore.FieldValue.increment(goingDelta),
      interestedCount: admin.firestore.FieldValue.increment(interestedDelta),
      updatedAt: Date.now()
    });
  });

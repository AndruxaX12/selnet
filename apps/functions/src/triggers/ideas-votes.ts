import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const db = admin.firestore();

export const onIdeaVoteWrite = functions.firestore
  .document("ideas/{id}/votes/{uid}")
  .onWrite(async (change, ctx) => {
    const ideaId = ctx.params.id as string;
    const ref = db.collection("ideas").doc(ideaId);

    const before = change.before.exists ? (change.before.data() as any).v as (1|-1) : 0;
    const after  = change.after.exists ? (change.after.data() as any).v as (1|-1) : 0;

    let upDelta = 0, downDelta = 0, scoreDelta = 0;

    // случаи:
    // 0 -> +1     : up +1, score +1
    // 0 -> -1     : down +1, score -1
    // +1 -> 0     : up -1, score -1
    // -1 -> 0     : down -1, score +1
    // +1 -> -1    : up -1, down +1, score -2
    // -1 -> +1    : down -1, up +1, score +2
    if (before === 0 && after === 1) { upDelta=+1; scoreDelta=+1; }
    else if (before === 0 && after === -1) { downDelta=+1; scoreDelta=-1; }
    else if (before === 1 && after === 0) { upDelta=-1; scoreDelta=-1; }
    else if (before === -1 && after === 0) { downDelta=-1; scoreDelta=+1; }
    else if (before === 1 && after === -1) { upDelta=-1; downDelta=+1; scoreDelta=-2; }
    else if (before === -1 && after === 1) { downDelta=-1; upDelta=+1; scoreDelta=+2; }
    else return;

    await ref.update({
      upCount: admin.firestore.FieldValue.increment(upDelta),
      downCount: admin.firestore.FieldValue.increment(downDelta),
      score: admin.firestore.FieldValue.increment(scoreDelta),
      updatedAt: Date.now()
    });
  });

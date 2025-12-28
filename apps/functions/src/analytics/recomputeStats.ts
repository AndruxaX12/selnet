import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

const db = admin.firestore();

export async function recomputeStats() {
  const out: any = {
    at: Date.now(),
    counts: { signals: 0, ideas: 0, events: 0 },
    signalsByStatus: {},
    signalsByType: {},
    signalsBySettlement: {},
    ideasByStatus: {},
    eventsUpcoming: 0,
    eventsPast: 0
  };

  // signals
  {
    const snap = await db.collection("signals").select("status","type","settlementId").get();
    out.counts.signals = snap.size;
    snap.forEach(d => {
      const x = d.data() as any;
      out.signalsByStatus[x.status || "unknown"] = (out.signalsByStatus[x.status || "unknown"] || 0) + 1;
      out.signalsByType[x.type || "other"] = (out.signalsByType[x.type || "other"] || 0) + 1;
      const s = x.settlementId || "unknown";
      out.signalsBySettlement[s] = (out.signalsBySettlement[s] || 0) + 1;
    });
  }

  // ideas
  {
    const snap = await db.collection("ideas").select("status").get();
    out.counts.ideas = snap.size;
    snap.forEach(d => {
      const x = d.data() as any;
      out.ideasByStatus[x.status || "unknown"] = (out.ideasByStatus[x.status || "unknown"] || 0) + 1;
    });
  }

  // events
  {
    const now = Date.now();
    const snap = await db.collection("events").select("when").get();
    out.counts.events = snap.size;
    snap.forEach(d => {
      const x = d.data() as any;
      if ((x.when || 0) >= now) out.eventsUpcoming++; else out.eventsPast++;
    });
  }

  await db.collection("stats").doc("global").set(out, { merge: true });
  return out;
}

export const statsOnCall = functions.https.onCall(async (_data, ctx) => {
  if (!ctx.auth?.uid) throw new functions.https.HttpsError("unauthenticated", "Login required");
  // опростен guard: позволи на всеки логнат (или затегни до admin)
  return await recomputeStats();
});

export const statsDaily = functions.pubsub.schedule("every 24 hours").onRun(async () => {
  await recomputeStats();
});

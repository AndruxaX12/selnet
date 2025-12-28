import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

type Bucket = Record<string, number[]>;

type Summary = {
  count: number;
  p50?: number;
  p75?: number;
  p95?: number;
  p99?: number;
  avg?: number;
};

function summarize(values: number[]): Summary {
  if (!values.length) return { count: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = (p: number) => {
    if (!sorted.length) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)));
    return Math.round(sorted[idx] * 100) / 100;
  };
  const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  return {
    count: sorted.length,
    p50: percentile(0.5),
    p75: percentile(0.75),
    p95: percentile(0.95),
    p99: percentile(0.99),
    avg: Math.round(avg * 100) / 100
  };
}

export const aggregateVitalsHourly = functions.pubsub.schedule("every 60 minutes").onRun(async () => {
  const end = Date.now();
  const start = end - 60 * 60 * 1000;

  const snapshot = await db
    .collection("telemetry")
    .doc("vitals")
    .collection("raw")
    .where("at", ">=", start)
    .where("at", "<", end)
    .get();

  if (snapshot.empty) {
    await db
      .collection("telemetry")
      .doc("vitals")
      .collection("hourly")
      .doc(String(end))
      .set({ at: end, count: 0 });
    return null;
  }

  const buckets: Bucket = {};
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() as { name?: string; value?: number };
    const key = (data.name || "unknown").toUpperCase();
    const value = Number(data.value ?? 0);
    if (!Number.isFinite(value)) return;
    (buckets[key] ||= []).push(value);
  });

  const stats = Object.fromEntries(
    Object.entries(buckets).map(([metric, values]) => [metric, summarize(values)])
  );

  await db
    .collection("telemetry")
    .doc("vitals")
    .collection("hourly")
    .doc(String(end))
    .set({ at: end, ...stats });

  return null;
});

export const cleanupTelemetry = functions.pubsub.schedule("every 24 hours").onRun(async () => {
  const keepRawMs = 3 * 24 * 60 * 60 * 1000;
  const keepHourlyMs = 60 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  async function purge(collectionPath: string, threshold: number) {
    let deleted = 0;
    while (true) {
      const snapshot = await db
        .collection(collectionPath)
        .where("at", "<", now - threshold)
        .limit(500)
        .get();

      if (snapshot.empty) break;

      const batch = db.batch();
      snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      deleted += snapshot.docs.length;
      if (snapshot.docs.length < 500) break;
    }
    return deleted;
  }

  await Promise.all([
    purge("telemetry/vitals/raw", keepRawMs),
    purge("telemetry/vitals/hourly", keepHourlyMs),
    purge("telemetry/errors/client", keepRawMs)
  ]);

  return null;
});

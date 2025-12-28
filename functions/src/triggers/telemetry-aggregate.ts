import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const db = admin.firestore();

// Планирана функция: всеки час агрегира последните 24ч в дневни кофи
export const aggregateVitalsHourly = functions.pubsub.schedule("every 60 minutes").onRun(async () => {
  const since = Date.now() - 24*3600*1000;
  const snap = await db.collection("telemetry").doc("vitals").collection("raw").where("at",">=", since).get();

  // квантизация по ден (UTC) и по метрика
  const buckets: Record<string, number[]> = {}; // key = day|name
  snap.forEach(d => {
    const x = d.data() as any;
    const day = new Date(x.at).toISOString().slice(0,10);
    const key = `${day}|${x.name}` ;
    (buckets[key] ||= []).push(Number(x.value));
  });

  const writes = [];
  for (const key of Object.keys(buckets)) {
    const [day, name] = key.split("|");
    const arr = buckets[key].sort((a,b)=>a-b);
    const pct = (p:number)=> arr.length ? arr[Math.floor((p/100)* (arr.length-1))] : 0;
    const doc = {
      day, name,
      p50: pct(50), p75: pct(75), p90: pct(90), p95: pct(95), p99: pct(99),
      min: arr[0] || 0, max: arr[arr.length-1] || 0,
      count: arr.length, at: Date.now()
    };
    const ref = db.collection("telemetry").doc("vitals").collection("daily").doc(`${day}_${name}` );
    writes.push(ref.set(doc, { merge: true }));
  }
  await Promise.all(writes);
  console.log(`Aggregated ${snap.size} vitals into ${writes.length} daily buckets`);
});

// Почистване на raw и грешки >30 дни
export const cleanupTelemetry = functions.pubsub.schedule("every 24 hours").onRun(async () => {
  const older = Date.now() - 30*24*3600*1000;
  let totalDeleted = 0;

  for (const path of [
    ["telemetry","vitals","raw"],
    ["telemetry","errors","client"]
  ]) {
    const col = db.collection(path.join("/"));
    let hasMore = true;
    while (hasMore) {
      const snap = await col.where("at","<", older).limit(500).get();
      if (snap.empty) break;

      const batch = db.batch();
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      totalDeleted += snap.size;
      hasMore = snap.size === 500;
    }
  }

  console.log(`Cleaned up ${totalDeleted} old telemetry records`);
  return { deleted: totalDeleted };
});

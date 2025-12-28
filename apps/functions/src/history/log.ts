import * as admin from "firebase-admin";
const db = admin.firestore();

export async function addHistory(coll: "signals"|"ideas"|"events", id: string, entry: {
  at?: number; by?: string|null; type: string; msg: string; diff?: any;
}) {
  const ref = db.collection(coll).doc(id).collection("history").doc();
  await ref.set({ at: Date.now(), by: null, ...entry });
}

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const db = admin.firestore();

export const onAnyCreateDenormSettlement = functions.firestore
  .document("{collId}/{docId}")
  .onCreate(async (snap, ctx) => {
    const { collId } = ctx.params as any;
    if (!["signals","ideas","events"].includes(collId)) return;
    const data = snap.data() as any;
    const sid = data.settlementId;
    if (!sid) return;
    const s = await db.collection("settlements").doc(sid).get();
    if (!s.exists) return;
    const x: any = s.data();
    await snap.ref.update({
      settlementLabel: data.settlementLabel || x.name,
      settlementMunicipality: x.municipality || null,
      settlementProvince: x.province || null
    });
  });

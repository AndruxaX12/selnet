import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

const db = admin.firestore();

/**
 * Поддържа yesCount/noCount/maybeCount на events/{id}
 * при create/update/delete на events/{id}/rsvps/{uid}
 */
export const onRsvpWrite = functions.firestore
  .document("events/{eventId}/rsvps/{uid}")
  .onWrite(async (change, context) => {
    const eventId = context.params.eventId as string;
    const eventRef = db.collection("events").doc(eventId);

    // Прочети текущите стойности
    const snap = await eventRef.get();
    if (!snap.exists) return;

    const before = change.before.exists ? (change.before.data() as any) : null;
    const after  = change.after.exists  ? (change.after.data() as any)  : null;

    // Определи промяната
    const dec = (field: "yesCount"|"noCount"|"maybeCount") => admin.firestore.FieldValue.increment(-1);
    const inc = (field: "yesCount"|"noCount"|"maybeCount") => admin.firestore.FieldValue.increment(1);

    const updates: any = { updatedAt: Date.now() };

    const mapVal = (v?: string|null): "yesCount"|"noCount"|"maybeCount"|null => {
      if (v === "yes") return "yesCount";
      if (v === "no") return "noCount";
      if (v === "maybe") return "maybeCount";
      return null;
    };

    const beforeKey = mapVal(before?.value);
    const afterKey  = mapVal(after?.value);

    if (!before && afterKey) {
      updates[afterKey] = inc(afterKey);
    } else if (beforeKey && !after) {
      updates[beforeKey] = dec(beforeKey);
    } else if (beforeKey && afterKey) {
      if (beforeKey !== afterKey) {
        updates[beforeKey] = dec(beforeKey);
        updates[afterKey]  = inc(afterKey);
      } // иначе няма промяна
    } else {
      return;
    }

    await eventRef.update(updates);
  });

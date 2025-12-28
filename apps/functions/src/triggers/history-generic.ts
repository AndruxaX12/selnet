import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { addHistory } from "../history/log";

const db = admin.firestore();

const WATCHED: Record<string, string[]> = {
  signals: ["title","desc","type","where","when","settlementId","status"],
  ideas:   ["title","desc","status"],
  events:  ["title","desc","where","when"]
};

export const onAnyDocUpdateHistory = functions.firestore
  .document("{collId}/{docId}")
  .onUpdate(async (change, ctx) => {
    const { collId, docId } = ctx.params as any;
    if (!["signals","ideas","events"].includes(collId)) return;

    const before = change.before.data() as any;
    const after = change.after.data() as any;

    const keys = WATCHED[collId];
    const diff: any = {};
    let changed = false;

    for (const k of keys) {
      const a = JSON.stringify(after[k] ?? null);
      const b = JSON.stringify(before[k] ?? null);
      if (a !== b) { diff[k] = { from: before[k] ?? null, to: after[k] ?? null }; changed = true; }
    }
    if (!changed) return;

    await addHistory(collId as any, docId, {
      type: "edit",
      msg: "Редакция на полета",
      diff
    });
  });

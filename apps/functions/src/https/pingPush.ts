import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendToUser } from "../utils/messaging";

export const pingPush = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Login required");
  await sendToUser(uid, {
    notification: { title: "Тестово известие", body: "Работи! 🎉" },
    data: { type: "test" }
  });
  return { ok: true };
});

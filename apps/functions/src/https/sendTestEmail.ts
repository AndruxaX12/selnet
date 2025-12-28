import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { renderSignalStatusEmail } from "../templates/wrap";
import { sendEmail } from "../utils/email";

export const sendTestEmail = functions.https.onCall(async (_data, ctx) => {
  const uid = ctx.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const db = admin.firestore();
  const u = await db.collection("users").doc(uid).get();
  const email = u.data()?.email as string | undefined;
  if (!email) throw new functions.https.HttpsError("failed-precondition", "No email on profile");

  const html = renderSignalStatusEmail({
    signalTitle: "Тестов сигнал",
    status: "in_progress",
    url: "https://selnet.bg/",
    date: new Date().toLocaleString("bg-BG")
  });

  await sendEmail(email, "Тест: СелНет известие", html);
  return { ok: true };
});

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { renderSignalStatusEmail } from "../templates/wrap";
import { sendEmail } from "../utils/email";

const db = admin.firestore();

/**
 * При промяна на signals/{id}.status → ако авторът има email и emailOptIn == true → изпрати имейл.
 */
export const onSignalStatusChangeEmail = functions.firestore
  .document("signals/{id}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    if (!before || !after) return;
    if (before.status === after.status) return;

    const signalId = context.params.id as string;
    const authorUid = after.authorUid;
    if (!authorUid) return;

    const userSnap = await db.collection("users").doc(authorUid).get();
    if (!userSnap.exists) return;
    const user = userSnap.data() as any;
    const email = user?.email;
    const emailOptIn = !!user?.settings?.emailOptIn;
    if (!email || !emailOptIn) return;

    const url = `https://selnet.bg/signals/${signalId}`; // смени домейна при нужда
    const html = renderSignalStatusEmail({
      signalTitle: after.title || "Сигнал",
      status: after.status,
      url,
      date: new Date().toLocaleString("bg-BG")
    });

    await sendEmail(email, "Обновен сигнал", html);
  });

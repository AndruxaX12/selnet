import * as admin from "firebase-admin";
const db = admin.firestore();
const messaging = admin.messaging();

export async function sendToUser(uid: string, payload: admin.messaging.MessagingPayload) {
  const tokensSnap = await db.collection("users").doc(uid).collection("tokens").get();
  const tokens = tokensSnap.docs.map((d) => d.id).filter(Boolean);
  if (!tokens.length) return { sent: 0 };

  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: payload.notification,
    data: payload.data
  });

  // Почисти невалидни
  const failures = res.responses.map((r, i) => (!r.success ? tokens[i] : null)).filter(Boolean) as string[];
  await Promise.all(
    failures.map((t) => db.collection("users").doc(uid).collection("tokens").doc(t).delete().catch(() => {}))
  );

  return { sent: res.successCount };
}

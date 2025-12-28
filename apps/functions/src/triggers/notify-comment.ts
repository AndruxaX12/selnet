import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { sendToUser } from "../utils/messaging";
import { renderNewCommentEmail } from "../templates/wrap";
import { sendEmail } from "../utils/email";

const db = admin.firestore();

/**
 * При нов коментар под {coll}/{docId}/comments/{cid}:
 * - Определи получателите: автор + всички предишни коментатори (без автора на коментара).
 * - За всеки получател: push/email според settings.
 * - Идемпотентност: използвай notificationsLog/{coll}_{docId}_{cid}.
 */
export const onCommentCreateNotify = functions.firestore
  .document("{collId}/{docId}/comments/{cid}")
  .onCreate(async (snap, ctx) => {
    const { collId, docId, cid } = ctx.params as any;
    const comment = snap.data() as any;
    const authorUid = comment.by as string;

    // идемпотентност
    const logId = `${collId}_${docId}_${cid}`;
    const logRef = db.collection("notificationsLog").doc(logId);
    const exists = await logRef.get();
    if (exists.exists) return;

    // вземи документа (за заглавие, автор)
    const docRef = db.collection(collId).doc(docId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return;
    const base = docSnap.data() as any;
    const docAuthor = base.authorUid || base.createdBy || null;
    const title = base.title || "(без заглавие)";

    // събери участниците (списък uid)
    const commentsSnap = await docRef.collection("comments").select("by").get();
    const participants = new Set<string>();
    commentsSnap.forEach(d => {
      const u = (d.data() as any).by;
      if (u) participants.add(u);
    });

    // добави автора на документа
    if (docAuthor) participants.add(docAuthor);

    // махни автора на коментара
    participants.delete(authorUid);

    // без получатели → излез
    if (participants.size === 0) {
      await logRef.set({ at: Date.now(), recipients: 0 });
      return;
    }

    // подготви view url
    const url = `https://selnet.bg/${collId}/${docId}#c_${cid}`;
    const preview = String(comment.text || "").slice(0, 180) + (String(comment.text || "").length > 180 ? "…" : "");

    // извести всеки получател
    let notified = 0;
    for (const uid of participants) {
      const uSnap = await db.collection("users").doc(uid).get();
      if (!uSnap.exists) continue;
      const u = uSnap.data() as any;
      const email = u?.email as string | undefined;
      const emailOn = !!u?.settings?.emailOptIn;
      const pushOn = !!u?.settings?.pushOptIn;

      // PUSH
      if (pushOn) {
        await sendToUser(uid, {
          notification: {
            title: "Нов коментар",
            body: `${title}: ${preview}`
          },
          data: { type: "comment", coll: collId, docId, cid, url }
        }).catch(() => null);
      }

      // EMAIL
      if (emailOn && email) {
        const html = renderNewCommentEmail({ title, collection: collId, commentPreview: preview, url });
        await sendEmail(email, "Нов коментар", html).catch(() => null);
      }

      notified++;
    }

    await logRef.set({ at: Date.now(), recipients: notified, collId, docId, cid });
  });

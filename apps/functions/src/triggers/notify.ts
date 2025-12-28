import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { sendToUser } from "../utils/messaging";
import { addHistory } from "../history/log";

const db = admin.firestore();

/**
 * Когато се промени status на signals/{id} → информирай автора (ако не е анонимен).
 */
export const onSignalStatusChange = functions.firestore
  .document("signals/{id}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    if (!before || !after) return;

    if (before.status === after.status) return;
    const authorUid = after.authorUid;
    if (!authorUid) return; // анонимен подател

    const title = "Обновен сигнал";
    const body = `Статус: ${after.status}`;

    // Send FCM push notification
    await sendToUser(authorUid, {
      notification: { title, body },
      data: { type: "signal_status", signalId: context.params.id as string, status: String(after.status) }
    });

    // Create in-app notification in inbox
    const now = Date.now();
    await db.collection("users").doc(authorUid).collection("inbox").add({
      type: "info",
      channel: "signals",
      title: `Статус: ${after.status}`,
      body: after.title || `Сигнал ${context.params.id}`,
      link: `/signals/${context.params.id}`,
      icon: "📣",
      createdAt: now
    });

    // Log status change to history
    await addHistory("signals", context.params.id as string, {
      type: "status",
      msg: `Статус сменен на "${after.status}"`,
      diff: { statusFrom: before.status, statusTo: after.status }
    });
  });

/**
 * Когато се промени status на ideas/{id} → информирай автора.
 */
export const onIdeaStatusChange = functions.firestore
  .document("ideas/{id}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    if (!before || !after) return;

    if (before.status === after.status) return;
    const authorUid = after.authorUid;
    if (!authorUid) return;

    const title = "Обновена идея";
    const body = `Статус: ${after.status}`;

    // Send FCM push notification
    await sendToUser(authorUid, {
      notification: { title, body },
      data: { type: "idea_status", ideaId: context.params.id as string, status: String(after.status) }
    });

    // Create in-app notification in inbox
    const now = Date.now();
    await db.collection("users").doc(authorUid).collection("inbox").add({
      type: "info",
      channel: "ideas",
      title: `Статус: ${after.status}`,
      body: after.title || `Идея ${context.params.id}`,
      link: `/ideas/${context.params.id}`,
      icon: "💡",
      createdAt: now
    });

    // Log status change to history
    await addHistory("ideas", context.params.id as string, {
      type: "status",
      msg: `Статус сменен на "${after.status}"`,
      diff: { statusFrom: before.status, statusTo: after.status }
    });
  });

/**
 * Когато се промени status на events/{id} → информирай създателя.
 */
export const onEventStatusChange = functions.firestore
  .document("events/{id}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    if (!before || !after) return;

    if (before.status === after.status) return;
    const createdBy = after.createdBy;
    if (!createdBy) return;

    const title = "Обновено събитие";
    const body = `Статус: ${after.status}`;

    // Send FCM push notification
    await sendToUser(createdBy, {
      notification: { title, body },
      data: { type: "event_status", eventId: context.params.id as string, status: String(after.status) }
    });

    // Create in-app notification in inbox
    const now = Date.now();
    await db.collection("users").doc(createdBy).collection("inbox").add({
      type: "info",
      channel: "events",
      title: `Статус: ${after.status}`,
      body: after.title || `Събитие ${context.params.id}`,
      link: `/events/${context.params.id}`,
      icon: "📅",
      createdAt: now
    });

    // Log status change to history
    await addHistory("events", context.params.id as string, {
      type: "status",
      msg: `Статус сменен на "${after.status}"`,
      diff: { statusFrom: before.status, statusTo: after.status }
    });
  });

"use client";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app, auth as getAuth } from "@/lib/firebase";
import { getFirestore, doc, setDoc, deleteDoc } from "firebase/firestore";

const VAPID = process.env.NEXT_PUBLIC_VAPID_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";
const TOKEN_KEY = "push:lastToken";

export async function ensureFCMSupported() {
  if (typeof window === "undefined") return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

function currentUser() {
  try {
    return getAuth().currentUser;
  } catch {
    return null;
  }
}

export async function registerPush() {
  try {
    if (!(await ensureFCMSupported())) return null;
    if (!("serviceWorker" in navigator)) return null;
    if (!process.env.NEXT_PUBLIC_VAPID_KEY) {
      console.warn("registerPush: NEXT_PUBLIC_VAPID_KEY is missing. Push notifications will not work.");
      return;
    }

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return null;
      } catch {
        return null;
      }
    }
    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      return null;
    }

    if (!app) {
      console.warn("Firebase app is not initialized. Push notifications will not work.");
      return null;
    }
    const messaging = getMessaging(app);
    const existing = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    const swReg = existing ?? await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, { vapidKey: VAPID, serviceWorkerRegistration: swReg }).catch(() => null);

    const user = currentUser();
    if (!token || !user) return token;

    const db = getFirestore(app);
    await setDoc(doc(db, "users", user.uid, "tokens", token), {
      token,
      ua: navigator.userAgent,
      at: Date.now()
    });
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
    return token;
  } catch (error) {
    console.error("registerPush: Failed to register push notifications", error);
    return null;
  }
}

export async function unregisterPush() {
  const user = currentUser();
  if (!user) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    return;
  }

  const token = (() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  })();

  if (!token) return;
  if (!app) {
    console.warn("Firebase app is not initialized. Cannot access Firestore.");
    return;
  }
  const db = getFirestore(app);
  await deleteDoc(doc(db, "users", user.uid, "tokens", token)).catch(() => {});
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function onForegroundMessage(cb: (data: { title?: string; body?: string; link?: string; icon?: string; raw: any }) => void) {
  let unsubscribe: (() => void) | null = null;

  (async () => {
    try {
      if (!(await ensureFCMSupported())) {
        console.log("FCM not supported, skipping message listener");
        return;
      }
      
      // Check if messagingSenderId is configured
      if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
        console.log("Firebase Messaging not configured (missing messagingSenderId), skipping");
        return;
      }
      
      if (!app) {
        console.warn("Firebase app is not initialized. Push message listener will not work.");
        return;
      }
      const messaging = getMessaging(app);
      unsubscribe = onMessage(messaging, (payload) => {
        const notification = payload.notification || {};
        const link = (payload.fcmOptions as any)?.link || (payload.data || {}).link;
        cb({
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          link,
          raw: payload
        });
      });
    } catch (error: any) {
      console.log("onForegroundMessage: Messaging not available, skipping", error?.message || "Unknown error");
    }
  })();

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

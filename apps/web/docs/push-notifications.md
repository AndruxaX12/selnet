# Push Notifications Integration

## Overview

SelNet Web uses Firebase Cloud Messaging (FCM) for web push. The flow covers:

- Token registration per authenticated user stored in `users/{uid}/tokens/{token}`.
- Foreground messages surfaced as toasts, background messages delivered by `firebase-messaging-sw.js`.
- Notification preferences stored under `users/{uid}` (the `notify` object) for channel mute (`signals`, `ideas`, `events`, `system`) and global enable flag.
- Inbox synchronization: each push send writes to `users/{uid}/inbox/*` (client mirrors via `useInbox`).

## Environment

Set the following in `apps/web/.env.local` and `.env.production`:

```ini
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=selnet-ab187
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=selnet-ab187.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=932806802011
NEXT_PUBLIC_FIREBASE_APP_ID=1:932806802011:web:xxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_VAPID_KEY=<YOUR_WEB_PUSH_VAPID_KEY>
NEXT_PUBLIC_VAPID_KEY=${NEXT_PUBLIC_FIREBASE_VAPID_KEY}
```

## Service Worker

`apps/web/public/firebase-messaging-sw.js` initializes Firebase via compat SDK (10.12.2) and handles background notifications:

- Normalizes payloads to ensure `title`, `body`, `icon`, and fallback `link`.
- Displays notification using `/icons/icon-192.png` default.
- Handles `notificationclick` by opening the provided link or `/bg`.

Ensure this file is deployed at the root of the web app and not cached aggressively.

## Client Helpers

Key modules:

- `apps/web/src/lib/messaging.ts`:
  - `ensureFCMSupported()` gracefully checks browser support.
  - `registerPush()` registers the messaging SW, requests permission (if needed), retrieves token with VAPID key, and writes token doc to `users/{uid}/tokens/{token}`.
  - `unregisterPush()` removes token doc and clears cached token on logout or permission revocation.
  - `onForegroundMessage()` binds a callback to display toast notifications while the page is active.
- `apps/web/src/components/notify/ForegroundPushListener.tsx`: attaches toast handler using `useToast` (already mounted in `ClientLayout`).
- `apps/web/src/components/auth/AuthProvider.tsx`: hook push registration on login and removal on logout.
- `apps/web/src/components/notify/PushSettings.tsx`: UI for enabling/disabling push and muting channels stored in Firestore.
- `apps/web/src/components/notify/NotifyBell.tsx`: renders unread badge, dropdown listing, and uses `markNotificationRead` helpers.

### inboxActions

`apps/web/src/lib/notify/inboxActions.ts` exports:

- `markNotificationRead(uid, id)` – sets `read/readAt` in Firestore.
- `markAllNotificationsRead(uid)` – bulk updates the latest 200 unread entries.

`useInbox(pageSize)` now returns `{ items, unread, loading, refresh }`, leveraging snapshot listeners and in-memory cache.

## Firestore Structure

```
users/{uid}
  notify.enabled: boolean
  notify.muted: string[]
  tokens/{token}
    token: string
    ua: string
    at: number
  inbox/{docId}
    title: string
    body?: string
    channel: "signals"|"ideas"|"events"|"system"
    link?: string
    icon?: string
    createdAt: number
    read: boolean
    readAt?: number
```

### Security rules (reminder)

- `users/{uid}/tokens/*`: only owner read/write.
- `users/{uid}/inbox/*`: only owner read/write.
- Ensure server-side mute checks before sending push.

## Backend Helper (Functions)

In Cloud Functions (`apps/functions/src/utils/messaging.ts` sample):

```ts
import * as admin from "firebase-admin";
const db = admin.firestore();

type Payload = {
  title: string;
  body?: string;
  link?: string;
  icon?: string;
  channel: "signals" | "ideas" | "events" | "system";
};

export async function sendToUser(uid: string, payload: Payload) {
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const data = snap.data() || {};
  const prefs = data.notify || {};

  if (prefs.enabled === false) return;
  const muted: string[] = prefs.muted || [];
  if (muted.includes(payload.channel)) return;

  await userRef.collection("inbox").add({
    ...payload,
    read: false,
    createdAt: Date.now()
  });

  const tokensSnap = await userRef.collection("tokens").get();
  const tokens = tokensSnap.docs.map((doc) => doc.id);
  if (!tokens.length) return;

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    webpush: payload.link ? { fcmOptions: { link: payload.link } } : undefined
  });
}
```

Use this helper for events (comments, status changes, system notices). Reuse channel keys to respect mute preferences.

## Admin/API Actions

- `markNotificationRead(uid, id)` or `markAllNotificationsRead(uid)` for manual moderation tools or when user views an item via API route.
- `PushSettings` controls push enable/mute inline; you may expose similar toggles in admin UI if needed.

## Testing Checklist

1. Configure `.env.local` with valid Firebase web config + VAPID key.
2. Start dev server, sign in as test user.
3. Navigate to `/me/notifications/settings`, enable push. Browser should prompt for notifications.
4. Verify Firestore:
   - Token document created under `users/{uid}/tokens`.
   - `notify.enabled` flag set true, `muted` array stored.
5. Use backend helper (or temporary script) to send push with payload `channel: "system"`.
   - **Foreground:** With tab focused, toast appears via `ForegroundPushListener`.
   - **Background:** Close tab, trigger send again; OS notification appears and clicking opens provided link (default `/bg`).
6. Inspect `users/{uid}/inbox/*` document added for each send.
7. Open dropdown bell (`NotifyBell`), ensure unread badge count matches.
8. Click "Отбележи всички прочетени"; documents update with `read/readAt`, badge resets.
9. Toggle mute for `signals` and send `channel: "signals"` – push suppressed, but inbox entry still added (or adjust if you prefer no entry).
10. Logout → ensure token document removed (check Firestore) and `push:lastToken` cleared in localStorage.

## Deployment Notes

- The service worker must be hosted at the site root; ensure build/deploy retains `firebase-messaging-sw.js`.
- VAPID key must correspond to the FCM project linked to `selnet-ab187`.
- Update `apps/functions` dependency versions if using the admin SDK for messaging.
- Provide environment variables in CI/CD (Vercel, etc.) for both `NEXT_PUBLIC_VAPID_KEY` and Firebase config keys.

## Follow-ups

- Implement server endpoint(s) for secure inbox read updates if needed.
- Consider scheduling cleanup for stale tokens and pruning read notifications.
- Evaluate analytics on mute usage and notification effectiveness.

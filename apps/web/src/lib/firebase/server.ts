import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

let app: App;
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || "selnet-ab187";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
  } else {
    // Fallback за development без credentials
    app = initializeApp({ projectId });
  }
} else {
  app = getApps()[0]!;
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export { FieldValue };

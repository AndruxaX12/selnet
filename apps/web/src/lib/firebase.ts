import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBOtsHBzYm3JeZ-V5mRZjBh3DcQ-RBhGQI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "selnet-ab187.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "selnet-ab187",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "selnet-ab187.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "932806802011",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:932806802011:web:fe94012a84fdc76498dd7e",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Get or create Firebase app
function getFirebaseApp(): FirebaseApp {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// Export app for client-side use
export const app = isClient ? getFirebaseApp() : null;

// Lazy initialization of Firebase services
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export const auth = (): Auth | null => {
  if (typeof window === "undefined") {
    return null;
  }
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
};

export const db = (): Firestore => {
  if (!isClient) {
    throw new Error("Firebase Firestore can only be used on the client side");
  }
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
};

export const storage = (): FirebaseStorage => {
  if (!isClient) {
    throw new Error("Firebase Storage can only be used on the client side");
  }
  if (!_storage) {
    _storage = getStorage(getFirebaseApp());
  }
  return _storage;
};

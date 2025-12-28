import { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { adminAuth } from "@/lib/firebase/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { SignalDetail } from "./signal-detail";

interface SignalPageProps {
  params: { id: string };
}

// Helper function to safely convert Firebase timestamp to ISO string
function toISOString(value: any): string | null {
  if (!value) return null;
  
  // Firebase Timestamp object
  if (value?.toDate && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  
  // Already a string
  if (typeof value === "string") {
    return value;
  }
  
  // Unix timestamp (number)
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  
  // Date object
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  return null;
}

export async function generateMetadata({ params }: SignalPageProps): Promise<Metadata> {
  try {
    const doc = await adminDb.collection("signals").doc(params.id).get();
    
    if (!doc.exists) {
      return { title: "Сигнал не е намерен | СелНет" };
    }
    
    const data = doc.data();
    
    return {
      title: `${data?.title || "Сигнал"} | СелНет`,
      description: data?.description?.substring(0, 160) || data?.desc?.substring(0, 160),
    };
  } catch (error) {
    return { title: "Сигнал | СелНет" };
  }
}

export default async function SignalPage({ params }: SignalPageProps) {
  let user = null;
  try {
    user = await getSessionUser();
  } catch (error) {
    console.error("Error fetching session user:", error);
    // Continue without user
  }
  
  try {
    const doc = await adminDb.collection("signals").doc(params.id).get();
    
    if (!doc.exists) {
      notFound();
    }
    
    const data = doc.data();
    
    // Normalize signal data from various possible field names
    const signal = {
      id: doc.id,
      title: data?.title || "Без заглавие",
      description: data?.description || data?.desc || "",
      category: data?.category || data?.type || "Друго",
      status: data?.status || "novo",
      priority: data?.priority || "normal",
      
      // Location data
      district: data?.district || data?.settlementLabel || "",
      address: data?.address || "",
      location: data?.location || data?.geo || null,
      
      // Author info - проверяваме много възможни имена на полета
      author_id: data?.author_id || data?.authorId || data?.userId || data?.user_id || data?.createdBy || null,
      author_email: data?.author_email || data?.authorEmail || data?.email || data?.userEmail || null,
      author_name: data?.author_name || data?.authorName || data?.userName || data?.user_name || data?.displayName || data?.name || null,
      author_photo: data?.author_photo || data?.authorPhoto || data?.photoURL || data?.userPhoto || null,
      author_role: data?.author_role || data?.authorRole || data?.role || null,
      isAnonymous: data?.isAnonymous === true, // Само ако е изрично true
      
      // Media
      photos: data?.photos || [],
      
      // Stats
      views: data?.views || data?.views_count || 0,
      comments_count: data?.comments_count || 0,
      votes_support: data?.votes_support || data?.votesCount || 0,
      watchers: data?.watchers || 0,
      
      // Timestamps
      created_at: toISOString(data?.created_at) || toISOString(data?.createdAt) || new Date().toISOString(),
      updated_at: toISOString(data?.updated_at) || toISOString(data?.updatedAt) || null,
    };
    
    // Ако няма author_name но има author_id, опитай да вземеш от Firebase Auth или Firestore
    if (!signal.author_name && signal.author_id && signal.author_id !== "anonymous") {
      try {
        // Първо опитай от Firebase Auth
        const authUser = await adminAuth.getUser(signal.author_id);
        signal.author_name = authUser.displayName || authUser.email?.split("@")[0] || null;
        signal.author_email = signal.author_email || authUser.email || null;
        signal.author_photo = signal.author_photo || authUser.photoURL || null;
        signal.author_role = signal.author_role || authUser.customClaims?.role || null;
      } catch (authError) {
        // Ако не е в Auth, опитай от Firestore users колекция
        try {
          const userDoc = await adminDb.collection("users").doc(signal.author_id).get();
          const userData = userDoc.data();
          if (userData) {
            signal.author_name = userData.displayName || userData.email?.split("@")[0] || null;
            signal.author_email = signal.author_email || userData.email || null;
            signal.author_photo = signal.author_photo || userData.photoURL || null;
            signal.author_role = signal.author_role || userData.role || null;
            console.log("[SignalPage] Loaded author from Firestore:", signal.author_id, signal.author_name);
          }
        } catch (firestoreError) {
          console.log("[SignalPage] Could not fetch author from Firestore:", signal.author_id, firestoreError);
        }
      }
    }
    
    // Ако все още няма име, но има email, използвай го
    if (!signal.author_name && signal.author_email) {
      signal.author_name = signal.author_email.split("@")[0];
    }
    
    console.log("[SignalPage] Final signal data:", {
      id: signal.id,
      isAnonymous: signal.isAnonymous,
      author_id: signal.author_id,
      author_name: signal.author_name,
      author_role: signal.author_role
    });
    
    return <SignalDetail signal={signal} />;
  } catch (error) {
    console.error("Error loading signal:", error);
    notFound();
  }
}

"use client";
import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";

export function useUserDoc<T = any>() {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("useUserDoc: Effect triggered", { user: user?.uid || null });
    if (!user) { 
      console.log("useUserDoc: No user, clearing data");
      setData(null); 
      setLoading(false); 
      return; 
    }
    
    try {
      console.log("useUserDoc: Setting up Firestore listener");
      const db = getFirestore(app);
      const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
        console.log("useUserDoc: Firestore snapshot", { exists: snap.exists(), id: snap.id });
        setData((snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null));
        setLoading(false);
      }, (error) => {
        console.error("useUserDoc: Firestore error", error);
        setLoading(false);
      });
      return () => {
        console.log("useUserDoc: Cleaning up listener");
        unsub();
      };
    } catch (error) {
      console.error("useUserDoc: Error setting up listener", error);
      setLoading(false);
    }
  }, [user]);

  return { user, data, loading };
}

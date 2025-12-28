"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { registerPush, unregisterPush } from "@/lib/messaging";
import {
  onAuthStateChanged,
  User,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  getIdToken,
  signInWithCustomToken
} from "firebase/auth";

// Extended user type that includes localStorage user data
type LocalUser = {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string | null;
  role?: string;
};

type AuthCtx = {
  user: User | null;
  localUser: LocalUser | null; // Fallback user from localStorage
  loading: boolean;
  sendLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authInstance = useMemo(() => auth(), []);
  const [user, setUser] = useState<User | null>(null);
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount and restore session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setLocalUser(userData);
          
          // Try to restore session cookie immediately if we have a token
          const idToken = localStorage.getItem('idToken') || 
                         localStorage.getItem('firebaseToken') || 
                         localStorage.getItem('token');
          
          if (idToken) {
            fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
              credentials: 'include'
            }).then(response => {
              if (response.ok) {
                console.log("AuthProvider: Session restored successfully on mount");
              } else {
                console.warn("AuthProvider: Failed to restore session on mount", response.status);
              }
            }).catch(error => {
              console.error("AuthProvider: Error restoring session on mount", error);
            });
          }
        } catch (e) {
          console.error("AuthProvider: Error parsing localStorage user", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    try {
      console.log("AuthProvider: Setting up auth state listener", { auth: authInstance?.app.name || 'unknown' });
      return onAuthStateChanged(authInstance, async (u) => {
        console.log("AuthProvider: Auth state changed", { user: u?.uid || null });
        setUser(u);
        setLoading(false);
        if (u) {
          try {
            // Force refresh to get latest claims
            const idToken = await getIdToken(u, true);
            
            // Store in localStorage for API calls
            if (typeof window !== 'undefined') {
              localStorage.setItem("idToken", idToken);
            }
            
            // Update session cookie
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken })
            });
          } catch (error) {
            console.error("AuthProvider: Error in session setup", error);
          }
        } else {
          // Check if we have a user in localStorage but no Firebase Auth session
          const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          // Check for multiple possible token keys
          const idToken = typeof window !== 'undefined' ? 
            (localStorage.getItem('idToken') || 
             localStorage.getItem('firebaseToken') || 
             localStorage.getItem('token')) : null;
          
          if (storedUser && idToken) {
            console.log("AuthProvider: Creating session from localStorage", { 
              hasUser: !!storedUser, 
              hasToken: !!idToken 
            });
            try {
              // Create session cookie using stored token
              const response = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
                credentials: 'include' // Ensure cookies are sent/received
              });
              
              if (response.ok) {
                console.log("AuthProvider: Session cookie created successfully");
              } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("AuthProvider: Failed to create session", errorData);
                // Token might be expired, clear it
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('idToken');
                  localStorage.removeItem('firebaseToken');
                  localStorage.removeItem('token');
                }
              }
            } catch (error) {
              console.error("AuthProvider: Error creating session from localStorage", error);
            }
          } else {
            console.log("AuthProvider: No user available", { 
              hasUser: !!storedUser, 
              hasToken: !!idToken 
            });
          }
        }
      });
    } catch (error) {
      console.error("AuthProvider: Error setting up auth listener", error);
      setLoading(false);
      return () => {};
    }
  }, [authInstance]);

  useEffect(() => {
    if (!user && !localUser) return;
    registerPush().catch((error) => {
      console.warn("AuthProvider: push registration failed", error);
    });
  }, [user, localUser]);

  useEffect(() => {
    if (user || localUser) return;
    unregisterPush().catch((error) => {
      console.warn("AuthProvider: push unregistration failed", error);
    });
  }, [user, localUser]);

  const sendLink = async (email: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const actionCodeSettings = {
      url: `${baseUrl}/verify?email=${encodeURIComponent(email)}` ,
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(authInstance, email, actionCodeSettings);
    window.localStorage.setItem("emailForSignIn", email);
  };

  const signOut = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    await unregisterPush().catch(() => {});
    await authInstance.signOut();
    // Clear localStorage user data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('idToken');
    }
    setLocalUser(null);
  };

  const value = useMemo(() => ({ user, localUser, loading, sendLink, signOut }), [user, localUser, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

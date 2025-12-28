import { auth } from "./firebase";
import { getIdToken } from "firebase/auth";

export async function getIdTokenHeader(forceRefresh = false): Promise<Record<string, string>> {
  try {
    const authInstance = auth();
    if (!authInstance) return {};
    const user = authInstance.currentUser;
    
    if (!user) {
      console.warn("getIdTokenHeader: No current user");
      return {};
    }
    
    // Use cached token by default for faster performance
    // Only force refresh when explicitly needed (e.g., after role changes)
    const token = await getIdToken(user, forceRefresh);
    
    if (!token) {
      console.warn("getIdTokenHeader: No token returned");
      return {};
    }
    
    // Store in localStorage for compatibility
    localStorage.setItem("idToken", token);
    
    return { authorization: `Bearer ${token}` };
  } catch (error) {
    console.error("getIdTokenHeader error:", error);
    return {};
  }
}

export function getStoredIdTokenHeader(): Record<string, string> {
  try {
    const token = localStorage.getItem("idToken");
    if (token && token.trim()) {
      return { authorization: `Bearer ${token}` };
    }
    return {};
  } catch {
    return {};
  }
}

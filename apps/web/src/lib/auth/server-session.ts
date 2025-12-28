import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/server";
import type { RoleKey } from "@/lib/roles";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "selnet_session";

type DecodedToken = {
  uid: string;
  email?: string;
  name?: string;
  role?: RoleKey;
  email_verified?: boolean;
  firebase?: {
    sign_in_attributes?: {
      role?: RoleKey;
    };
  };
};

export type SessionUser = {
  uid: string;
  email?: string;
  displayName?: string;
  role?: RoleKey;
  emailVerified?: boolean;
};

export async function getSessionDecoded() {
  const cookie = cookies().get(COOKIE_NAME)?.value;
  console.log("[getSessionDecoded] Cookie exists:", !!cookie);
  console.log("[getSessionDecoded] Cookie name:", COOKIE_NAME);
  
  if (!cookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    console.log("[getSessionDecoded] Decoded token:", { uid: decoded.uid, role: decoded.role });
    return decoded as DecodedToken;
  } catch (error) {
    console.log("[getSessionDecoded] Error verifying cookie:", error);
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  console.log("[getSessionUser] Called");
  const decoded = await getSessionDecoded();
  if (!decoded) {
    console.log("[getSessionUser] No decoded token found");
    return null;
  }
  const role = decoded.role ?? decoded.firebase?.sign_in_attributes?.role;
  const user = {
    uid: decoded.uid,
    email: decoded.email,
    displayName: decoded.name,
    role,
    emailVerified: decoded.email_verified
  };
  console.log("[getSessionUser] Returning user:", { uid: user.uid, role: user.role, displayName: user.displayName });
  return user;
}

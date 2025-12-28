import { adminAuth, adminDb } from "./firebase-admin";
import { NextRequest } from "next/server";

const MOD = new Set(["coordinator","municipal","admin","operator"]);

export async function requireModerator(req: NextRequest) {
  let tokenStr = req.cookies.get("selnet_session")?.value;
  
  // Also check Authorization header
  if (!tokenStr) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      tokenStr = authHeader.substring(7);
    }
  }

  if (!tokenStr) return { ok: false, status: 401 as const, error: "No session" };

  const decoded = await adminAuth.verifyIdToken(tokenStr).catch(() => null);
  if (!decoded) return { ok: false, status: 401 as const, error: "Invalid session" };

  // 1) claims
  const claimRole = (decoded as any).role as string | undefined;
  let role = claimRole;
  let scopes: any = (decoded as any).scopes || null;

  if (!role || !MOD.has(role)) {
    // 2) fallback към Firestore
    const snap = await adminDb.collection("users").doc(decoded.uid).get();
    const d: any = snap.exists ? snap.data() : {};
    role = d.role;
    scopes = d.scopes;
    if (!role || !MOD.has(role)) return { ok: false, status: 403 as const, error: "Forbidden" };
  }

  return { ok: true, uid: decoded.uid, email: decoded.email, role, scopes };
}

/** Проверка дали даден документ е в обхват */
export function isDocInScope(doc: any, scopes?: any): boolean {
  if (!scopes) return false;
  const sId = doc.settlementId || null;
  const municipality = doc.municipality || doc.settlementMunicipality || null;
  const province = doc.province || doc.settlementProvince || null;

  if (Array.isArray(scopes.settlements) && sId && scopes.settlements.includes(sId)) return true;
  if (Array.isArray(scopes.municipalities) && municipality && scopes.municipalities.includes(municipality)) return true;
  if (Array.isArray(scopes.provinces) && province && scopes.provinces.includes(province)) return true;
  return false;
}

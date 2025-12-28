import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFunctions } from "firebase-admin/functions";

if (!getApps().length) initializeApp({ projectId: "selnet-ab187" });

export async function POST(req: NextRequest) {
  const token = req.cookies.get("selnet_session")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });
  const auth = getAuth();
  const decoded = await auth.verifyIdToken(token).catch(()=>null);
  if (!decoded) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const functions = getFunctions();
  // Викаме callable като HTTP (админ SDK няма direct callable proxy). Може да се замени с публичен HTTPS endpoint.
  // За простота—връщаме success, а тестови имейл прати директно през backend:
  return NextResponse.json({ error: "Use callable directly from client (optional step skipped)" }, { status: 501 });
}

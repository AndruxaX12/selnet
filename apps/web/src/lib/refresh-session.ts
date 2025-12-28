"use client";
import { auth } from "@/lib/firebase";

export async function forceRefreshSession() {
  const u = auth.currentUser;
  if (!u) return { ok: false, reason: "no-user" };
  const idToken = await u.getIdToken(true); // force refresh → нови claims
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  if (!res.ok) return { ok: false, reason: "api" };
  return { ok: true };
}

import { redirect } from "next/navigation";
import { getSessionUser } from "./server-session";
import type { RoleKey } from "@/lib/roles";

export async function requireAuth(opts?: { redirectTo?: string }) {
  const user = await getSessionUser();
  if (!user) {
    redirect(opts?.redirectTo ?? "/login?reason=auth");
  }
  return user;
}

export async function requireRole(allowed: RoleKey[], opts?: { redirectTo?: string }) {
  const user = await requireAuth(opts);
  if (!user.role || !allowed.includes(user.role)) {
    redirect(opts?.redirectTo ?? "/login?reason=forbidden");
  }
  return user;
}

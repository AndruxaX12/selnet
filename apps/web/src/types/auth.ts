// Auth types - re-export from server-session for client components
import type { RoleKey } from "@/lib/roles";

export type SessionUser = {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role?: RoleKey;
  emailVerified?: boolean;
};

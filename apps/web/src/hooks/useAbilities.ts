"use client";

import { useEffect, useState } from "react";
import { can as canCheck, hasAnyRole as hasAnyRoleCheck, hasAllRoles as hasAllRolesCheck, PolicyAction, RoleKey } from "@/lib/auth/policies";

interface AbilitiesData {
  roles: RoleKey[];
  abilities: Record<string, boolean>;
  userId?: string;
  email?: string;
}

export function useAbilities() {
  const [data, setData] = useState<AbilitiesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    async function fetchAbilities() {
      try {
        const res = await fetch("/api/me/abilities", {
          credentials: "include",
          cache: "no-store",
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            // Not authenticated - guest
            if (isMounted) {
              setData({ roles: ["guest"], abilities: {} });
              setIsLoading(false);
            }
            return;
          }
          throw new Error("Failed to fetch abilities");
        }
        
        const json = await res.json();
        
        if (isMounted) {
          setData(json);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("useAbilities error:", err);
        if (isMounted) {
          setError(err as Error);
          setData({ roles: ["guest"], abilities: {} });
          setIsLoading(false);
        }
      }
    }
    
    fetchAbilities();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  const roles = data?.roles ?? ["guest"];
  
  return {
    roles,
    abilities: data?.abilities ?? {},
    userId: data?.userId,
    email: data?.email,
    isLoading,
    error,
    isAuthenticated: roles.length > 0 && !roles.includes("guest"),
    isGuest: roles.includes("guest") && roles.length === 1,
    can: (action: PolicyAction) => canCheck(roles, action),
    hasRole: (role: RoleKey) => roles.includes(role),
    hasAnyRole: (requiredRoles: RoleKey[]) => hasAnyRoleCheck(roles, requiredRoles),
    hasAllRoles: (requiredRoles: RoleKey[]) => hasAllRolesCheck(roles, requiredRoles),
  };
}

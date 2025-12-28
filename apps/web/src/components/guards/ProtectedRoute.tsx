"use client";

import { useAbilities } from "@/hooks/useAbilities";
import { RoleKey } from "@/lib/auth/policies";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  anyOf?: RoleKey[];
  allOf?: RoleKey[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  anyOf,
  allOf,
  requireAuth = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { hasAnyRole, hasAllRoles, isAuthenticated, isLoading } = useAbilities();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoading) return;
    
    // Check auth requirement
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo ?? "/login?reason=auth_required");
      return;
    }
    
    // Check anyOf roles
    if (anyOf && !hasAnyRole(anyOf)) {
      router.push(redirectTo ?? "/403");
      return;
    }
    
    // Check allOf roles
    if (allOf && !hasAllRoles(allOf)) {
      router.push(redirectTo ?? "/403");
      return;
    }
  }, [isLoading, isAuthenticated, anyOf, allOf, requireAuth, hasAnyRole, hasAllRoles, router, redirectTo]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  // Don't render until we've checked permissions
  if (requireAuth && !isAuthenticated) return null;
  if (anyOf && !hasAnyRole(anyOf)) return null;
  if (allOf && !hasAllRoles(allOf)) return null;
  
  return <>{children}</>;
}

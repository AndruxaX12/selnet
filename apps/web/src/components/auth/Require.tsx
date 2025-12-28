"use client";

import { useAbilities } from "@/hooks/useAbilities";
import { RoleKey } from "@/lib/auth/policies";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface RequireProps {
  anyOf?: RoleKey[];
  allOf?: RoleKey[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function Require({ anyOf, allOf, children, fallback = null }: RequireProps) {
  const { hasAnyRole, hasAllRoles, isLoading } = useAbilities();
  
  if (isLoading) return null;
  
  if (anyOf && !hasAnyRole(anyOf)) return <>{fallback}</>;
  if (allOf && !hasAllRoles(allOf)) return <>{fallback}</>;
  
  return <>{children}</>;
}

interface RequirePermissionProps {
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({ action, children, fallback = null }: RequirePermissionProps) {
  const { can, isLoading } = useAbilities();
  
  if (isLoading) return null;
  
  if (!can(action as any)) return <>{fallback}</>;
  
  return <>{children}</>;
}

interface GuestPromptProps {
  message?: string;
  children?: ReactNode;
}

export function GuestPrompt({ message = "Влез, за да продължиш", children }: GuestPromptProps) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <p className="text-muted-foreground">{message}</p>
      {children || (
        <a 
          href={`/${locale}/login`} 
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Вход
        </a>
      )}
    </div>
  );
}

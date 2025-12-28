// apps/web/src/app/[locale]/operator/layout.tsx
"use client";

import { ReactNode, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard, Inbox, Map, FileText, Settings, Users, Shield, BookOpen, List, Globe, MessageSquare, Tag } from "lucide-react";
import { useUserDoc } from "@/lib/useUserDoc";
import { auth } from "@/lib/firebase";
import { signOut, getIdTokenResult } from "firebase/auth";
import { ROLES } from "@/lib/rbac/roles";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: authUser, data: firestoreUser, loading } = useUserDoc<any>();
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const authInstance = useMemo(() => auth(), []);

  const navItems = useMemo(
    () => [
      { id: "dashboard", name: "Табло", href: "/admin", icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { id: "signals", name: "Всички сигнали", href: "/admin/signals", icon: List, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { id: "map", name: "Карта", href: "/admin/map", icon: Map, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { id: "reports", name: "Анализи", href: "/admin/analytics", icon: FileText, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { id: "communication", name: "Комуникация", href: "/admin/communication", icon: MessageSquare, roles: [ROLES.ADMIN] },
      { id: "users", name: "Потребители", href: "/admin/users", icon: Users, roles: [ROLES.ADMIN] },
      { id: "categories", name: "Категории", href: "/admin/categories", icon: Tag, roles: [ROLES.ADMIN] },
      { id: "pages", name: "Страници", href: "/admin/pages", icon: Globe, roles: [ROLES.ADMIN] },
      { id: "audit", name: "Действия", href: "/admin/logs", icon: BookOpen, roles: [ROLES.ADMIN] },
      // { id: "settings", name: "Настройки", href: "/admin/settings", icon: Settings, roles: [ROLES.ADMIN] },
      { id: "pages", name: "Страници", href: "/admin/pages", icon: Globe, roles: [ROLES.ADMIN] },
      { id: "audit", name: "Действия", href: "/admin/logs", icon: BookOpen, roles: [ROLES.ADMIN] },
      // { id: "settings", name: "Настройки", href: "/admin/settings", icon: Settings, roles: [ROLES.ADMIN] },
    ],
    []
  );

  useEffect(() => {
    if (!authUser) {
      router.push("/login");
      router.push(`${base}/login`);
      return;
    }

    const checkRoles = async () => {
      try {
        const idTokenResult = await getIdTokenResult(authUser, true);
        const claimRole = (idTokenResult.claims as any)?.role as string | undefined;
        const claimRoles = (idTokenResult.claims as any)?.roles;
        const userRoles: string[] = [];
        if (claimRole) userRoles.push(String(claimRole));
        if (Array.isArray(claimRoles)) {
          userRoles.push(...claimRoles.map((r) => String(r)));
        }
        const normalized = userRoles.map((r) => r.toUpperCase());
        setRoles(normalized);
        
        // Redirect if user doesn't have required roles
        if (!normalized.includes(ROLES.ADMIN) && !normalized.includes(ROLES.OPERATOR)) {
          router.push(`${base}/error/401`);
        }
      } catch (error) {
        console.error("Error checking roles:", error);
        router.push(`${base}/login`);
      } finally {
        setRolesLoading(false);
      }
    };

    checkRoles();
  }, [authUser, router, base]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("firebaseToken");
        localStorage.removeItem("idToken");
        localStorage.removeItem("token");
      }
      if (authInstance) {
        await signOut(authInstance);
      }
      router.push(`${base}/login`);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Filter nav items based on user roles
  const filteredNavItems = navItems.filter(item => 
    item.roles.some(role => roles.includes(role))
  );

  const [counts, setCounts] = useState<Record<string, number>>({ inbox: 0, mod: 0, users: 0 });

  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      try {
        const a = await fetch(`/api/admin/approvals?status=pending`).then(r => r.ok ? r.json() : { items: [] });
        const m = await fetch(`/api/admin/mod/list?coll=signals&status=new&limit=100`).then(r => r.ok ? r.json() : { rows: [] });
        const u = await fetch(`/api/admin/users`).then(r => r.ok ? r.json() : { users: [] }).catch(() => ({ users: [] }));
        if (!mounted) return;
        setCounts({
          inbox: Array.isArray(a.items) ? a.items.length : 0,
          mod: Array.isArray(m.rows) ? m.rows.length : 0,
          users: Array.isArray(u.users) ? u.users.length : 0
        });
      } catch {}
    };
    if (roles.includes(ROLES.ADMIN)) {
      loadCounts();
    }
    return () => { mounted = false; };
  }, [roles]);

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gray-800">
          <div className="flex items-center justify-center h-16 bg-gray-900">
            <h1 className="text-white font-bold text-xl">СелНет Админ</h1>
          </div>
          <div className="flex flex-col flex-grow overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    pathname === item.href
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {item.id === "inbox" && counts.inbox > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{counts.inbox}</span>
                  )}
                  {item.id === "mod" && counts.mod > 0 && (
                    <span className="ml-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">{counts.mod}</span>
                  )}
                  {item.id === "users" && counts.users > 0 && (
                    <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{counts.users}</span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Изход
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden bg-gray-800 text-white">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold">Меню</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white focus:outline-none"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          {/* Mobile sidebar */}
          {sidebarOpen && (
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                    pathname === item.href
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Изход
              </button>
            </div>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard, Inbox, Map, FileText, Settings, Users, Shield, BookOpen } from "lucide-react";
import { useUserDoc } from "@/lib/useUserDoc";
import { auth } from "@/lib/firebase";
import { signOut, getIdTokenResult, Auth } from "firebase/auth";

export default function OperatorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: authUser, data: firestoreUser, loading } = useUserDoc<any>();
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesChecked, setRolesChecked] = useState(false);

  const navItems = [
    { name: "Табло", href: `${base}/operator`, icon: LayoutDashboard },
    { name: "Опашки", href: `${base}/operator/inbox`, icon: Inbox },
    { name: "Карта", href: `${base}/operator/map`, icon: Map },
    { name: "Отчети", href: `${base}/operator/reports`, icon: FileText },
    { name: "Модериране", href: `${base}/operator/mod`, icon: Shield },
    { name: "Потребители", href: `${base}/operator/users`, icon: Users },
    { name: "Audit Logs", href: `${base}/operator/audit`, icon: BookOpen },
    { name: "Настройки", href: `${base}/operator/settings`, icon: Settings },
  ];

  useEffect(() => {
    setRolesChecked(false);
    setRolesLoading(true);
    
    if (!authUser) {
      setRoles([]);
      setRolesLoading(false);
      setRolesChecked(true);
      return;
    }
    
    getIdTokenResult(authUser, true)
      .then((idTokenResult) => {
        const claimRole = (idTokenResult.claims as any)?.role;
        const claimRoles = (idTokenResult.claims as any)?.roles || [];
        const combined = [
          ...(claimRole ? [String(claimRole)] : []),
          ...(Array.isArray(claimRoles) ? claimRoles.map((r: any) => String(r)) : [])
        ].map((r) => r.toLowerCase());

        const fsRole = (firestoreUser as any)?.role;
        const fsRoles = (firestoreUser as any)?.roles || [];
        const fallback = [
          ...(fsRole ? [String(fsRole)] : []),
          ...(Array.isArray(fsRoles) ? fsRoles.map((r: any) => String(r)) : [])
        ].map((r) => r.toLowerCase());

        const finalRoles = combined.length ? combined : fallback;
        setRoles(finalRoles);
        setRolesLoading(false);
        setTimeout(() => setRolesChecked(true), 500);
      })
      .catch((error) => {
        console.error("AdminLayout: Error getting token", error);
        setRoles([]);
        setRolesLoading(false);
        setRolesChecked(true);
      });
  }, [authUser, firestoreUser]);

  const user = firestoreUser || { email: authUser?.email, name: authUser?.displayName };
  const hasAccess = roles.includes("admin");

  useEffect(() => {
    if (rolesChecked) {
      if (!authUser || !hasAccess) {
        router.replace(`${base}/login?next=${base}/admin`);
      }
    }
  }, [rolesChecked, hasAccess, authUser, router, base]);

  const handleSignOut = async () => {
    try {
      await signOut(auth as Auth);
      router.push(`/${locale}`);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (loading || !rolesChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Зареждане...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mt-4 text-gray-700">Нямате достъп до админ панела.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Оператор</h2>
              <p className="text-sm text-gray-600 mt-1">Управление на сигнали</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">
            {user?.email || "Не сте влезли"}
          </div>
          {roles.length > 0 && (
            <div className="text-xs text-gray-400 mb-3">
              Роля: {roles.join(", ")}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Изход
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Оператор</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

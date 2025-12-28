"use client";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Menu, X, ChevronDown, Home, Search, AlertCircle, Lightbulb, Calendar, Map, User, Settings, LogOut } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";
import type { SessionUser } from "@/lib/auth/server-session";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLE_LABELS } from "@/lib/roles";

const NotifyBell = dynamic(() => import("@/components/notify/NotifyBell"), { ssr: false });

interface AppHeaderProps {
  sessionUser: SessionUser | null;
}

export default function AppHeader({ sessionUser }: AppHeaderProps) {
  const { user, localUser } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const authUser = useMemo(() => {
    // 1. Вземаме данните с приоритет: Локален обект > Firebase > Session
    const email = localUser?.email || user?.email || sessionUser?.email || "";
    const displayName = localUser?.displayName || user?.displayName || sessionUser?.displayName || "";
    const role = localUser?.role || (user as any)?.role || sessionUser?.role;

    // Ако нямаме поне име или имейл, считаме, че няма потребител
    if (!email && !displayName) return null;
    console.log("DEBUG Auth:", {
      hasUser: !!user,
      hasLocal: !!localUser,
      hasSession: !!sessionUser
    });
    return { email, displayName, role };

    // ВАЖНО: Тук трябва да са всички източници!
  }, [user, localUser, sessionUser]);

  // Важно: Превръщаме ролята в главни букви, за да съвпадне с ROLE_LABELS (USER, ADMIN, OPERATOR)
  const roleKey = (authUser?.role || "USER").toUpperCase() as keyof typeof ROLE_LABELS;

  const isAdmin = roleKey === "ADMIN";
  const isOperator = ["OPERATOR"].includes(roleKey);
  const isStaff = isAdmin || isOperator;

  const isActive = (path: string, exact = false) =>
    exact ? pathname === path : pathname?.startsWith(path);

  const coreLinks = [
    { href: "/", label: "Начало", icon: Home, exact: true },
    { href: "/map", label: "Карта", icon: Map },
  ];

  const extraLinks = [
    { href: "/signals", label: "Сигнали", icon: AlertCircle },
    { href: "/ideas", label: "Идеи", icon: Lightbulb },
    { href: "/events", label: "Събития", icon: Calendar },
  ];

  const desktopNavLinks = isStaff ? coreLinks : [...coreLinks, ...extraLinks];

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">

          <Link href="/" className="flex items-center space-x-2">
            <img src="/images/SelNet - Logo.png" alt="СелНет" className="h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {desktopNavLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href, link.exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/search"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/search") ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <Search className="h-4 w-4" />
              <span>Търсене</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            {authUser ? (
              <>
                <NotifyBell />
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                      {(authUser.displayName || authUser.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:flex flex-col items-start max-w-[140px] leading-tight text-left">
                      <span className="truncate w-full">{authUser.displayName || authUser.email.split('@')[0]}</span>
                      <span className="text-[10px] font-bold uppercase text-emerald-700">
                        {ROLE_LABELS[roleKey] || authUser.role || "Потребител"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-20 overflow-hidden">
                        {isStaff && (
                          <div className="py-2 bg-gray-50/50 border-b">
                            <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Навигация</div>
                            {extraLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-white transition-colors"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <link.icon className="mr-3 h-4 w-4 text-emerald-600" />
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        )}

                        <div className="py-1">
                          <Link href="/profile" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <User className="mr-3 h-4 w-4 text-gray-400" /> Моят профил
                          </Link>
                          <Link href="/settings" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <Settings className="mr-3 h-4 w-4 text-gray-400" /> Настройки
                          </Link>
                          {isAdmin && (
                            <Link href="/admin" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                              <Settings className="mr-3 h-4 w-4 text-orange-500" /> Администраторски панел
                            </Link>
                          )}
                          {isOperator && (
                            <Link href="/operator" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                              <Settings className="mr-3 h-4 w-4 text-blue-500" /> Операторски панел
                            </Link>
                          )}

                          <div className="border-t mt-1">
                            <div className="group flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors font-medium">
                              <LogOut className="mr-3 h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
                              <LogoutButton />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Вход</Link>
                <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700">Регистрация</Link>
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="space-y-1 px-4 py-3">
            {[...coreLinks, ...extraLinks, { href: "/search", label: "Търсене", icon: Search }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${isActive(link.href, link.exact) ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-100"}`}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

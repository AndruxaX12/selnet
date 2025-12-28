"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, User, FileText, Shield, Settings, LogOut, Users, BarChart3, Menu, X, Home, ChevronDown, Check } from "lucide-react";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/rbac/roles";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";


// Animated Logo Component
function AnimatedLogo() {
  const [showBotevgrad, setShowBotevgrad] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowBotevgrad((prev) => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-9 w-[180px] overflow-hidden">
      <div
        className={`absolute inset-0 flex items-center transition-all duration-700 ease-in-out ${!showBotevgrad ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
      >
        <Image
          src="/logo-selnet-full.png"
          alt="СелНет"
          fill
          className="object-contain object-left"
          priority
        />
      </div>
      <div
        className={`absolute inset-0 flex items-center transition-all duration-700 ease-in-out ${showBotevgrad ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
      >
        <Image
          src="/logo-botevgrad.png"
          alt="Моят Ботевград"
          fill
          className="object-contain object-left"
          priority
        />
      </div>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // In Header.tsx, update role checks to be case-insensitive
  const isAdmin = user?.role?.toUpperCase() === ROLES.ADMIN;
  const isAdministrator = user?.role?.toUpperCase() === ROLES.OPERATOR;

  useEffect(() => {
    // Check if user is logged in
    const loadUser = () => {
      const userDataString = localStorage.getItem('user');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          console.log('🔍 Header - User data from localStorage:', userData);
          console.log('🎭 Header - User role:', userData.role);
          console.log('📋 Header - ROLES constants:', ROLES);
          setUser(userData);

          // TODO: Load actual notification count from API
          // For now, check localStorage for test badge
          const testNotifications = localStorage.getItem('notificationCount');
          if (testNotifications) {
            setNotificationCount(parseInt(testNotifications, 10));
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    // Handle custom user update event (from Profile edit)
    const handleUserUpdate = (event: CustomEvent) => {
      console.log('🔄 Header - User updated event:', event.detail);
      setUser(event.detail);
    };

    loadUser();

    // Listen for storage changes (e.g., role updates in another tab)
    window.addEventListener('storage', loadUser);
    // Listen for immediate user updates (e.g., from Profile edit)
    window.addEventListener('userUpdated', handleUserUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('userUpdated', handleUserUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.relative')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('firebaseToken');
    setUser(null);
    setShowDropdown(false);
    setShowMobileMenu(false);
    window.location.href = "/";
  };

  // Get URL based on role - centralized logic
  const getRoleBasedUrl = () => {
    if (!user) return "/me/signals";
    if (user.role === ROLES.ADMIN || user.role === 'ADMIN') return "/admin";
    if (user.role === ROLES.OPERATOR || user.role === 'OPERATOR') return "/operator";
    return "/me/signals";
  };

  // Get URL for "My Signals" link
  const getMySignalsUrl = () => {
    return getRoleBasedUrl();
  };

  // Get notification URL (same as My Signals for now)
  const getNotificationsUrl = () => {
    return getRoleBasedUrl();
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    // TODO: Implement API call to mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  // Check if current page is active
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  // Get role display label
  // In Header.tsx, update the getRoleLabel function to handle case sensitivity
  const getRoleLabel = () => {
    if (!user?.role) return 'Потребител';
    const normalizedRole = (user.role as string).toUpperCase() as Role;
    return ROLE_LABELS[normalizedRole] || 'Потребител';
  };

  return (
    <header className="flex justify-between items-center px-4 py-2.5 border-b border-gray-200 z-50 bg-white shadow-sm sticky top-0">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center">
          <AnimatedLogo />
        </Link>
        <nav className="hidden md:flex items-center">
          <Link
            href="/signals"
            className={`px-3 py-1.5 font-semibold text-sm transition-colors flex items-center gap-1.5 border rounded-lg ${isActive("/signals")
              ? 'bg-green-600 text-white border-green-600'
              : 'text-gray-600 border-gray-200 hover:text-green-600 hover:border-green-400 hover:bg-green-50'
              }`}
          >
            <FileText className="w-4 h-4" />
            Всички сигнали
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {user ? (
          <>
            {/* Камбанка за нотификации */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 focus:outline-none transition-colors"
                title="Известия"
              >
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
                <Bell className="w-5 h-5" />
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <span className="font-semibold text-sm text-gray-700">Известия</span>
                    {notificationCount > 0 && (
                      <span className="text-xs text-blue-600 cursor-pointer" onClick={() => notifications.forEach(n => !n.read && markAsRead(n.id))}>
                        Маркирай всички
                      </span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        Няма нови известия
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {n.icon ? <span className="text-lg">{n.icon}</span> : <Bell className="h-5 w-5 text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {n.title}
                              </p>
                              {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-gray-400">
                                  {n.createdAt ? new Date(n.createdAt).toLocaleDateString('bg-BG') : ''}
                                </span>
                                {n.link && (
                                  <Link 
                                    href={n.link} 
                                    className="text-[10px] text-blue-600 hover:underline ml-auto"
                                    onClick={() => {
                                        markAsRead(n.id);
                                        setShowNotifications(false);
                                    }}
                                  >
                                    Виж повече
                                  </Link>
                                )}
                              </div>
                            </div>
                            {!n.read && (
                                <button 
                                    onClick={() => markAsRead(n.id)}
                                    className="self-start text-gray-400 hover:text-blue-600"
                                    title="Маркирай като прочетено"
                                >
                                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Моите сигнали / Admin Panel */}
            <Link
              href={getMySignalsUrl()}
              className={`font-semibold text-sm transition-colors hidden sm:inline ${isActive(getMySignalsUrl()) || isActive('/me/signals')
                ? 'text-green-600 underline'
                : 'text-gray-700 hover:text-green-600'
                }`}
            >
              {user.role === ROLES.ADMIN || user.role === 'ADMIN'
                ? 'Admin Panel'
                : user.role === ROLES.OPERATOR || user.role === 'OPERATOR'
                  ? 'Администриране'
                  : 'Моите сигнали'
              }
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(prev => !prev)}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none group"
              >
                <span className="inline-block h-8 w-8 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-200 group-hover:ring-green-500 transition-all">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Профил" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-full w-full text-gray-300 p-1" />
                  )}
                </span>

                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="font-semibold text-gray-900 text-sm">
                    {user.displayName || user.email?.split("@")[0] || "Потребител"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                    {getRoleLabel()}
                  </span>
                </div>

                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {/* Base User Menu - Always show for all logged-in users */}
                  <Link
                    href="/signals?mine=true"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <FileText className="w-4 h-4" />
                    Моите сигнали
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <User className="w-4 h-4" />
                    Профил
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Настройки
                  </Link>

                  {/* Admin Menu - Only show for admin/administrator */}
                  {(isAdmin || isAdministrator) && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Администрация
                      </div>

                      {isAdmin && (
                        <>
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                            onClick={() => setShowDropdown(false)}
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                          <Link
                            href="/admin/users"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowDropdown(false)}
                          >
                            <Users className="w-4 h-4" />
                            Потребители
                          </Link>
                          <Link
                            href="/admin/roles"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowDropdown(false)}
                          >
                            <BarChart3 className="w-4 h-4" />
                            Роли
                          </Link>
                        </>
                      )}

                      {isAdministrator && (
                        <Link
                          href="/operator/signals"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Shield className="w-4 h-4" />
                          Управление на сигнали
                        </Link>
                      )}
                    </>
                  )}

                  {/* Logout - Always show for all logged-in users */}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Изход
                  </button>
                </div>
              )}

            </div>

          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Влез
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
            >
              Регистрация
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <nav className="px-4 py-4 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              onClick={() => setShowMobileMenu(false)}
            >
              <Home className="w-4 h-4" />
              Начало
            </Link>
            <Link
              href="/signals"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              onClick={() => setShowMobileMenu(false)}
            >
              <FileText className="w-4 h-4" />
              Всички сигнали
            </Link>

            {user && (
              <>
                <div className="border-t border-gray-200 my-2"></div>

                {/* USER Links */}
                {(user.role === ROLES.USER || user.role === 'USER' || !user.role) && (
                  <>
                    <Link
                      href="/me"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FileText className="w-4 h-4" />
                      Моите сигнали
                    </Link>
                  </>
                )}

                {/* ADMINISTRATOR Links */}
                {(user.role === ROLES.OPERATOR || user.role === 'OPERATOR') && (
                  <>
                    <Link
                      href="/operator/signals"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-purple-600 hover:bg-purple-50 font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Shield className="w-4 h-4" />
                      Управление на сигнали
                    </Link>
                    <Link
                      href="/operator/users"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Users className="w-4 h-4" />
                      Потребители
                    </Link>
                  </>
                )}

                {/* ADMIN Links */}
                {(user.role === ROLES.ADMIN || user.role === 'ADMIN') && (
                  <>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-purple-600 hover:bg-purple-50 font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Shield className="w-4 h-4" />
                      Admin Panel
                    </Link>
                    <Link
                      href="/admin/users"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Users className="w-4 h-4" />
                      Потребители
                    </Link>
                  </>
                )}

                <div className="border-t border-gray-200 my-2"></div>

                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-4 h-4" />
                  Профил
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  Настройки
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Изход
                </button>
              </>
            )}

            {!user && (
              <>
                <Link
                  href="/login"
                  className="flex items-center justify-center px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Влез
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

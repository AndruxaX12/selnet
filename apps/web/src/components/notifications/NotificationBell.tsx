"use client";

import { useEffect, useState } from "react";
import { Bell, X, Check } from "lucide-react";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { usePathname } from "next/navigation";

interface Notification {
  id: string;
  category: string;
  title: string;
  body: string;
  icon: string;
  link?: string;
  created_at: number;
  read_at: number | null;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/notifications?limit=5", { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      const headers = await getIdTokenHeader();
      await fetch("/api/me/notifications/read", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] })
      });

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: Date.now() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  function formatRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return "Току-що";
    if (minutes < 60) return `Преди ${minutes} мин`;
    if (hours < 24) return `Преди ${hours} час${hours > 1 ? "а" : ""}`;
    return `Преди ${Math.floor(hours / 24)} ден${Math.floor(hours / 24) > 1 ? "я" : ""}`;
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Известия"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Известия</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Нямаш нови известия</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notif.read_at ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl flex-shrink-0">{notif.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notif.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {notif.body}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                          {notif.link && (
                            <a
                              href={notif.link}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                              onClick={() => setIsOpen(false)}
                            >
                              Виж →
                            </a>
                          )}
                        </div>
                      </div>
                      {!notif.read_at && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="p-1 text-gray-400 hover:text-green-600 rounded"
                          title="Маркирай прочетено"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <a
                href={`${base}/me?tab=notifications`}
                className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Виж всички известия
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

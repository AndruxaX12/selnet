"use client";
import { useEffect, useRef, useState } from "react";
import { useInbox } from "@/lib/notify/useInbox";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notify/inboxActions";
import { usePathname } from "next/navigation";

interface NotificationItem {
  id: string;
  type: "info"|"warning"|"success"|"error";
  channel: "signals"|"ideas"|"events"|"system";
  title: string;
  body?: string;
  link?: string;
  icon?: string;
  createdAt: number;
  readAt?: number;
  seenAt?: number;
}

export default function NotifyBell() {
  const { user } = useAuth();
  const { items, unread, loading } = useInbox(25);
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;

  useEffect(() => {
    const on = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener("click", on);
    return () => document.removeEventListener("click", on);
  }, []);

  const handleBellClick = () => {
    setIsAnimating(true);
    setOpen(!open);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleMarkAllRead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await markAllNotificationsRead(user.uid);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Известия"
        className={`relative rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          open ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${isAnimating ? 'animate-pulse' : ''}`}
        onClick={handleBellClick}
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-2 py-1 min-w-[20px] h-5 flex items-center justify-center font-bold animate-bounce">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 max-w-[92vw] rounded-xl border border-gray-200 bg-white shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔔</span>
                <h3 className="text-lg font-semibold text-gray-900">Известия</h3>
                {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
              </div>
              <form onSubmit={handleMarkAllRead}>
                <button
                  type="submit"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150"
                >
                  Отбележи всички прочетени
                </button>
              </form>
            </div>
          </div>

          <div className="max-h-96 overflow-auto">
            {items.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {items.map((n, index) => (
                  <NotifItem
                    key={n.id}
                    n={n}
                    index={index}
                  />
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm">Няма известия</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 text-right">
            <Link
              href={`${base}/me/notifications`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150"
            >
              Виж всички известия →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifItem({ n, index }: { n: NotificationItem; index: number }) {
  const { user } = useAuth();
  const [isMarking, setIsMarking] = useState(false);

  async function markRead() {
    if (!user) return;
    if (isMarking) return;
    setIsMarking(true);
    try {
      await markNotificationRead(user.uid, n.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsMarking(false);
    }
  }

  return (
    <li
      className={`p-4 transition-all duration-200 hover:bg-gray-50 ${
        !n.readAt ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      } ${index === 0 ? 'animate-in slide-in-from-right-2' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{n.icon || "🔔"}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                {n.title}
              </h4>
              {n.body && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {n.body}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {new Date(n.createdAt).toLocaleString('bg-BG')}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {n.link && (
              <a
                href={n.link}
                onClick={markRead}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors duration-150 inline-flex items-center gap-1"
              >
                Отвори
                <span className="text-xs">→</span>
              </a>
            )}
            {!n.readAt && (
              <button
                onClick={markRead}
                disabled={isMarking}
                className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md border border-gray-300 hover:border-gray-400 transition-colors duration-150 disabled:opacity-50"
              >
                {isMarking ? '...' : 'Прочетено'}
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

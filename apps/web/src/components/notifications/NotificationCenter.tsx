"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Loader2, Check, X, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  category: "system" | "signals" | "ideas" | "events";
  type: string;
  title: string;
  body: string;
  icon: string;
  link?: string;
  created_at: number;
  read_at: number | null;
}

type FilterType = "all" | "unread" | "system" | "signals" | "ideas" | "events";

export function NotificationCenter({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  async function fetchNotifications() {
    try {
      const headers = await getIdTokenHeader();
      const params = new URLSearchParams();
      if (filter !== "all") params.set("category", filter);
      if (filter === "unread") params.set("unread", "true");

      const res = await fetch(`/api/me/notifications?${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
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

  async function handleMarkAllRead() {
    try {
      const headers = await getIdTokenHeader();
      await fetch("/api/me/notifications/read-all", {
        method: "POST",
        headers
      });

      setNotifications(prev => prev.map(n => ({ ...n, read_at: Date.now() })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  async function handleDelete(id: string) {
    try {
      const headers = await getIdTokenHeader();
      await fetch(`/api/me/notifications/${id}`, {
        method: "DELETE",
        headers
      });

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }

  const groupedNotifications = groupByDate(notifications);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Известия</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} непрочетени
            </p>
          )}
        </div>
        {notifications.some(n => !n.read_at) && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Маркирай всички като прочетени
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "all", label: "Всички" },
          { id: "unread", label: "Непрочетени" },
          { id: "system", label: "Система" },
          { id: "signals", label: "Сигнали" },
          { id: "ideas", label: "Идеи" },
          { id: "events", label: "Події" }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as FilterType)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${
              filter === f.id
                ? "bg-primary-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-4">📬</div>
          <p className="text-lg font-medium">Нямаш {filter === "unread" ? "непрочетени " : ""}известия</p>
          <p className="text-sm mt-2">Известията ще се показват тук</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 sticky top-0 bg-white py-2">
                {date}
              </h3>
              <div className="space-y-2">
                {(items as Notification[]).map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkRead={() => handleMarkRead(notif.id)}
                    onDelete={() => handleDelete(notif.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete
}: {
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const isUnread = !notification.read_at;

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isUnread
          ? "bg-blue-50 border-blue-200 shadow-sm"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{notification.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${isUnread ? "text-gray-900" : "text-gray-700"}`}>
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{formatRelativeTime(notification.created_at)}</span>
            {notification.link && (
              <a
                href={notification.link}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Виж повече →
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isUnread && (
            <button
              onClick={onMarkRead}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Маркирай прочетено"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Изтрий"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  notifications.forEach((notif) => {
    const date = new Date(notif.created_at);
    const dateStr = date.toDateString();

    let label = "";
    if (dateStr === today) label = "Днес";
    else if (dateStr === yesterday) label = "Вчера";
    else if (now.getTime() - date.getTime() < 7 * 86400000) label = "Миналата седмица";
    else {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      label = `${day}.${month}.${year}`;
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(notif);
  });

  return groups;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Току-що";
  if (minutes < 60) return `Преди ${minutes} мин`;
  if (hours < 24) return `Преди ${hours} час${hours > 1 ? "а" : ""}`;
  if (days < 7) return `Преди ${days} ден${days > 1 ? "я" : ""}`;

  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");

  return `${day}.${month}.${year} ${h}:${m}`;
}

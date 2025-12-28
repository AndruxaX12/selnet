"use client";
import { app } from "@/lib/firebase";
import { collection, getFirestore, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

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

interface CacheEntry {
  timestamp: number;
  unread: number;
  items: NotificationItem[];
}

const CACHE_DURATION = 30000; // 30 seconds cache
const notificationCache = new Map<string, CacheEntry>();

export function useInbox(pageSize = 20) {
  const { user } = useAuth();
  const db = useMemo(()=>getFirestore(app), []);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Memoize the query to prevent unnecessary re-renders
  const inboxQuery = useMemo(() => {
    if (!user) return null;
    const base = collection(db, "users", user.uid, "inbox");
    return query(base, orderBy("createdAt","desc"), limit(pageSize));
  }, [db, user, pageSize]);

  // Check cache first
  const getCachedData = useCallback(() => {
    if (!user) return null;

    const cached = notificationCache.get(user.uid);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached;
    }
    return null;
  }, [user]);

  // Update cache
  const updateCache = useCallback((items: NotificationItem[], unread: number) => {
    if (!user) return;

    notificationCache.set(user.uid, {
      timestamp: Date.now(),
      unread,
      items
    });
  }, [user]);

  // Memoize the snapshot handler
  const handleSnapshot = useCallback((snap: any) => {
    const rows = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as NotificationItem));
    setItems(rows);
    const unreadCount = rows.filter((r: NotificationItem) => !r.readAt).length;
    setUnread(unreadCount);
    setLoading(false);
    updateCache(rows, unreadCount);
  }, [updateCache]);

  useEffect(() => {
    if (!inboxQuery) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedData();
    if (cached) {
      setItems(cached.items);
      setUnread(cached.unread);
      setLoading(false);
    }

    setLoading(true);
    const unsub = onSnapshot(inboxQuery, handleSnapshot, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    unsubscribeRef.current = unsub;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [inboxQuery, handleSnapshot, getCachedData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return { items, unread, loading, refresh: () => clearNotificationCache(user?.uid || undefined) };
}

// Utility function to clear cache (useful for manual refresh)
export function clearNotificationCache(uid?: string) {
  if (uid) {
    notificationCache.delete(uid);
  } else {
    notificationCache.clear();
  }
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { DocumentData } from "firebase/firestore";
import { collection, getFirestore, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/i18n/format";
import { app } from "@/lib/firebase";

type EventRow = {
  id: string;
  title?: string;
  where?: string;
  when?: number;
  settlementLabel?: string;
  stats?: { rsvpGoing?: number };
  rsvpGoing?: number;
};

export default function UpcomingEvents({ locale = "bg" }: { locale?: "bg" | "en" }) {
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const db = getFirestore(app);
    const now = Date.now();
    const qy = query(collection(db, "events"), where("when", ">=", now), orderBy("when", "asc"), limit(20));
    const unsubscribe = onSnapshot(
      qy,
      (snapshot) => {
        const items: EventRow[] = snapshot.docs.map((doc) => ({ id: doc.id, ...coerceEvent(doc.data()) }));
        setRows(items);
        setOffline(false);
      },
      () => {
        setOffline(true);
        fetch("/api/home/overview")
          .then((res) => res.json())
          .then((payload) => {
            const fallback = Array.isArray(payload?.events)
              ? (payload.events as Array<Record<string, unknown>>)
                  .map((item) => coerceEventFromApi(item))
                  .filter(Boolean)
              : [];
            setRows(fallback as EventRow[]);
          })
          .catch(() => setRows([]));
      }
    );
    return () => unsubscribe();
  }, []);

  const list = useMemo(() => {
    if (!rows) return [];
    return rows.sort((a, b) => (a.when ?? Infinity) - (b.when ?? Infinity)).slice(0, 4);
  }, [rows]);

  const title = locale === "bg" ? "Предстоящи събития" : "Upcoming events";

  return (
    <Card title={title} hint={offline ? "offline / fallback" : undefined}>
      {rows === null ? (
        <ListSkeleton />
      ) : (
        <>
          <ul className="space-y-3">
            {list.map((item) => (
              <li key={item.id} className="rounded-2xl border p-3 hover:bg-neutral-50">
                <a href={`/${locale}/events/${item.id}`} className="font-medium underline">
                  {item.title || "(без заглавие)"}
                </a>
                <div className="text-xs text-neutral-500 mt-1">
                  📍 {item.where || item.settlementLabel || ""} · 🗓 {formatDate(locale as any, item.when)}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Chip>👥 {item.stats?.rsvpGoing ?? item.rsvpGoing ?? 0}</Chip>
                  <a className="ml-auto text-xs underline" href={`/${locale}/events/${item.id}#rsvp`}>
                    {locale === "bg" ? "Запиши се" : "RSVP"}
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <Button as="a" href={`/${locale}/events`} variant="secondary" size="sm" className="w-full">
              {locale === "bg" ? "Виж всички събития" : "View all events"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function coerceEvent(data: DocumentData) {
  return {
    title: typeof data?.title === "string" ? data.title : undefined,
    where: typeof data?.where === "string" ? data.where : undefined,
    when: coerceTimestamp(data?.when),
    settlementLabel: typeof data?.settlementLabel === "string" ? data.settlementLabel : undefined,
    stats: typeof data?.stats === "object" && data?.stats !== null ? data.stats : undefined,
    rsvpGoing: typeof data?.rsvpGoing === "number" ? data.rsvpGoing : undefined
  } satisfies Partial<EventRow>;
}

function coerceEventFromApi(item: Record<string, unknown>) {
  const id = typeof item.id === "string" ? item.id : null;
  if (!id) return null;
  return {
    id,
    title: typeof item.title === "string" ? item.title : undefined,
    where: typeof item.where === "string" ? item.where : undefined,
    when: coerceTimestamp(item.when),
    settlementLabel: typeof item.settlementLabel === "string" ? item.settlementLabel : undefined,
    stats: typeof item.stats === "object" && item.stats !== null ? (item.stats as EventRow["stats"]) : undefined,
    rsvpGoing: typeof item.rsvpGoing === "number" ? item.rsvpGoing : undefined
  } satisfies EventRow;
}

function coerceTimestamp(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }
  return undefined;
}

function Card({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card border-cardborder shadow-sm">
      <div className="px-4 py-3 border-b font-medium flex items-center gap-2">
        <span>{title}</span>
        {hint && <span className="text-[11px] text-neutral-500">{hint}</span>}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function ListSkeleton() {
  return <div className="grid gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;
}

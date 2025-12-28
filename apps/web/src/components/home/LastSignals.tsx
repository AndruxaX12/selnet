"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, DocumentData, getFirestore, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/timeago";
import { app } from "@/lib/firebase";
import { useMapSelection } from "@/lib/mapSelection";
import { subscribeHomeMapCount } from "@/components/home/map/events";

type Row = {
  id: string;
  title?: string;
  createdAt?: number;
  settlementLabel?: string;
  status?: string;
};

export default function LastSignals({ locale = "bg" }: { locale?: "bg" | "en" }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [online, setOnline] = useState(true);
  const [mapCount, setMapCount] = useState<number | null>(null);
  const setSelection = useMapSelection((state) => state.setId);

  useEffect(() => {
    const db = getFirestore(app);
    const qy = query(collection(db, "signals"), orderBy("createdAt", "desc"), limit(20));
    const unsubscribe = onSnapshot(
      qy,
      (snapshot) => {
        const data: Row[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...coerceData(doc.data())
        }));
        setRows(data);
        setOnline(true);
      },
      () => {
        setOnline(false);
        fetch("/api/home/overview")
          .then((res) => res.json())
          .then((payload) => {
            const fallbackRows = Array.isArray(payload?.signals)
              ? (payload.signals as Array<Record<string, unknown>>)
                  .map((item) => coerceFallbackRow(item))
                  .filter(Boolean)
              : [];
            setRows(fallbackRows as Row[]);
          })
          .catch(() => {
            setRows([]);
          });
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeHomeMapCount((count) => setMapCount(count));
    return () => {
      unsubscribe();
    };
  }, []);

  const normalizedRows = useMemo(() => {
    return (rows || []).map((row) => ({
      ...row,
      status: normalizeStatus(row.status)
    }));
  }, [rows]);

  const title = locale === "bg" ? "Последни сигнали" : "Latest signals";
  const titleWithCount = mapCount != null ? `${title} · ${mapCount}` : title;

  if (rows === null) {
    return (
      <Card title={titleWithCount}>
        <ListSkeleton />
      </Card>
    );
  }

  return (
    <Card title={titleWithCount}>
      {!online && <div className="mb-2 text-[11px] text-neutral-500">offline / fallback</div>}
      <ul className="divide-y">
        {normalizedRows.slice(0, 8).map((row) => (
          <li
            key={row.id}
            className="py-3 flex items-start gap-2 cursor-pointer hover:bg-neutral-50 rounded-lg px-1 -mx-1"
            onMouseEnter={() => setSelection(`signals:${row.id}`)}
            onMouseLeave={() => setSelection(null)}
          >
            <div className="mt-0.5 text-[20px]">🛑</div>
            <div className="min-w-0 flex-1">
              <a className="font-medium underline truncate block" href={`/${locale}/signals/${row.id}`}>
                {row.title || "(без заглавие)"}
              </a>
              <div className="text-xs text-neutral-600 truncate">{row.settlementLabel || ""}</div>
              <div className="text-xs text-neutral-500 flex items-center gap-2">
                <span>{timeAgo(row.createdAt)}</span>
                <StatusBadge v={row.status} />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="pt-2">
        <Button as="a" href={`/${locale}/signals`} variant="secondary" size="sm" className="w-full">
          {locale === "bg" ? "Всички сигнали" : "All signals"}
        </Button>
      </div>
    </Card>
  );
}

function normalizeStatus(status?: string) {
  if (!status) return "new";
  const s = status.toLowerCase();
  if (["ново", "new"].includes(s)) return "new";
  if (["triaged", "оценено"].includes(s)) return "triaged";
  if (["in_progress", "в процес"].includes(s)) return "in_progress";
  if (["resolved", "решено"].includes(s)) return "resolved";
  if (["rejected", "отхвърлено"].includes(s)) return "rejected";
  return s;
}

function coerceData(data: DocumentData) {
  const createdAt = coerceTimestamp(data?.createdAt);
  return {
    title: typeof data?.title === "string" ? data.title : undefined,
    createdAt,
    settlementLabel: typeof data?.settlementLabel === "string" ? data.settlementLabel : undefined,
    status: typeof data?.status === "string" ? data.status : undefined
  } satisfies Partial<Row>;
}

function coerceFallbackRow(item: Record<string, unknown>) {
  const id = typeof item.id === "string" ? item.id : null;
  if (!id) return null;
  return {
    id,
    title: typeof item.title === "string" ? item.title : undefined,
    createdAt: coerceTimestamp(item.createdAt),
    settlementLabel: typeof item.settlementLabel === "string" ? item.settlementLabel : undefined,
    status: typeof item.status === "string" ? item.status : undefined
  } satisfies Row;
}

function coerceTimestamp(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return undefined;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card border-cardborder shadow-sm">
      <div className="px-4 py-3 border-b font-medium">{title}</div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y">
      {Array.from({ length: 6 }).map((_, index) => (
        <li key={index} className="py-3 flex items-start gap-2">
          <Skeleton className="w-6 h-6" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}

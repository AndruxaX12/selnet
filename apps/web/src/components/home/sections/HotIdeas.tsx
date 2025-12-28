"use client";

import { useEffect, useMemo, useState } from "react";
import type { DocumentData } from "firebase/firestore";
import { collection, getFirestore, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { timeAgo } from "@/lib/timeago";
import { app } from "@/lib/firebase";

type Idea = {
  id: string;
  title?: string;
  createdAt?: number;
  settlementLabel?: string;
  stats?: { votes?: number; comments?: number };
  votesUp?: number;
  commentsCount?: number;
};

export default function HotIdeas({ locale = "bg" }: { locale?: "bg" | "en" }) {
  const [rows, setRows] = useState<Idea[] | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const db = getFirestore(app);
    const qy = query(collection(db, "ideas"), orderBy("createdAt", "desc"), limit(30));
    const unsubscribe = onSnapshot(
      qy,
      (snapshot) => {
        const items: Idea[] = snapshot.docs.map((doc) => ({ id: doc.id, ...coerceIdea(doc.data()) }));
        setRows(items);
        setOffline(false);
      },
      () => {
        setOffline(true);
        fetch("/api/home/overview")
          .then((res) => res.json())
          .then((payload) => {
            const fallback = Array.isArray(payload?.ideas)
              ? (payload.ideas as Array<Record<string, unknown>>)
                  .map((item) => coerceIdeaFromApi(item))
                  .filter(Boolean)
              : [];
            setRows(fallback as Idea[]);
          })
          .catch(() => setRows([]));
      }
    );
    return () => unsubscribe();
  }, []);

  const list = useMemo(() => {
    if (!rows) return [];
    const now = Date.now();
    const withScore = rows.map((idea) => ({ idea, score: hotScore(idea, now) }));
    return withScore
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((entry) => entry.idea);
  }, [rows]);

  const title = locale === "bg" ? "Идеи" : "Ideas";

  return (
    <Card title={title} hint={offline ? "offline / fallback" : undefined}>
      {rows === null ? (
        <ListSkeleton />
      ) : (
        <>
          <ul className="space-y-3">
            {list.map((item) => (
              <li key={item.id} className="rounded-2xl border p-3 hover:bg-neutral-50">
                <a href={`/${locale}/ideas/${item.id}`} className="font-medium underline">
                  {item.title || "(без заглавие)"}
                </a>
                <div className="text-xs text-neutral-500 mt-1">
                  {item.settlementLabel || ""} · {timeAgo(item.createdAt)}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Chip>💬 {item.stats?.comments ?? item.commentsCount ?? 0}</Chip>
                  <Chip>👍 {item.stats?.votes ?? item.votesUp ?? 0}</Chip>
                  <a className="ml-auto text-xs underline" href={`/${locale}/ideas/${item.id}#discussion`}>
                    {locale === "bg" ? "Обсъждане" : "Discuss"}
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <Button as="a" href={`/${locale}/ideas`} variant="secondary" size="sm" className="w-full">
              {locale === "bg" ? "Виж всички идеи" : "View all ideas"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function hotScore(idea: Idea, now: number) {
  const votes = idea.stats?.votes ?? idea.votesUp ?? 0;
  const comments = idea.stats?.comments ?? idea.commentsCount ?? 0;
  const created = typeof idea.createdAt === "number" ? idea.createdAt : now;
  const ageHours = Math.max(1, (now - created) / (1000 * 60 * 60));
  return votes * 4 + comments * 2 - ageHours * 0.15;
}

function coerceIdea(data: DocumentData) {
  return {
    title: typeof data?.title === "string" ? data.title : undefined,
    createdAt: coerceTimestamp(data?.createdAt),
    settlementLabel: typeof data?.settlementLabel === "string" ? data.settlementLabel : undefined,
    stats: typeof data?.stats === "object" && data?.stats !== null ? data.stats : undefined,
    votesUp: typeof data?.votesUp === "number" ? data.votesUp : undefined,
    commentsCount: typeof data?.commentsCount === "number" ? data.commentsCount : undefined
  } satisfies Partial<Idea>;
}

function coerceIdeaFromApi(item: Record<string, unknown>) {
  const id = typeof item.id === "string" ? item.id : null;
  if (!id) return null;
  return {
    id,
    title: typeof item.title === "string" ? item.title : undefined,
    createdAt: coerceTimestamp(item.createdAt),
    settlementLabel: typeof item.settlementLabel === "string" ? item.settlementLabel : undefined,
    stats: typeof item.stats === "object" && item.stats !== null ? (item.stats as Idea["stats"]) : undefined,
    votesUp: typeof item.votesUp === "number" ? item.votesUp : undefined,
    commentsCount: typeof item.commentsCount === "number" ? item.commentsCount : undefined
  } satisfies Idea;
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

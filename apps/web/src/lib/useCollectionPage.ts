"use client";
import { useEffect, useMemo, useState } from "react";
import {
  collection, getFirestore, limit, onSnapshot, orderBy, query, startAfter, QueryDocumentSnapshot, DocumentData
} from "firebase/firestore";
import { app } from "@/lib/firebase";

type UseCollectionPageArgs = {
  path: string;
  order: [field: string, dir?: "asc" | "desc"];
  pageSize?: number;
  whereClauses?: Array<ReturnType<typeof import("firebase/firestore").where>>;
};

export function useCollectionPage<T = any>({ path, order, pageSize = 10, whereClauses = [] }: UseCollectionPageArgs) {
  const db = useMemo(() => getFirestore(app), []);
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [exhausted, setExhausted] = useState(false);

  const baseQuery = useMemo(() => {
    let q: any = query(collection(db, path), orderBy(order[0], order[1] ?? "desc"), limit(pageSize));
    if (whereClauses.length) {
      // @ts-ignore compose where
      q = query(collection(db, path), ...whereClauses, orderBy(order[0], order[1] ?? "desc"), limit(pageSize));
    }
    return q;
  }, [db, path, order[0], order[1], pageSize, whereClauses]);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(baseQuery, (snap) => {
      const docs = snap.docs;
      setItems(docs.map((d) => ({ id: d.id, ...d.data() } as T)));
      setCursor(docs.length ? docs[docs.length - 1] : null);
      setExhausted(docs.length < pageSize);
      setLoading(false);
    });
    return () => unsub();
  }, [baseQuery, pageSize]);

  const loadMore = async () => {
    if (!cursor || exhausted) return;
    const nextQ: any = query(baseQuery, startAfter(cursor));
    const unsub = onSnapshot(nextQ, (snap) => {
      const docs = snap.docs;
      setItems((prev) => [...prev, ...docs.map((d) => ({ id: d.id, ...d.data() } as T))]);
      setCursor(docs.length ? docs[docs.length - 1] : null);
      if (docs.length < pageSize) setExhausted(true);
    });
    // detach immediately after first batch
    setTimeout(() => unsub(), 0);
  };

  return { items, loading, loadMore, exhausted };
}

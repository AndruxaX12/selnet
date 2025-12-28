"use client";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, limit, orderBy, query
} from "firebase/firestore";

export type BaseDoc = { 
  id: string; 
  title: string; 
  desc?: string; 
  createdAt?: number; 
  updatedAt?: number; 
  type?: string; 
  status?: string; 
  where?: string; 
  when?: number; 
  collection: "signals"|"ideas"|"events" 
};

const CACHE_KEY = "selnet_search_cache_v2";
const MAX_PER_COLLECTION = 100; // Reduced from 1000 to 100 for better performance
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes instead of 60

export async function fetchAllForSearch(): Promise<BaseDoc[]> {
  const cached = safeRead();
  if (cached) return cached;

  const firestore = db();
  const [s, i, e] = await Promise.all([
    getDocs(query(collection(firestore, "signals"), orderBy("createdAt", "desc"), limit(MAX_PER_COLLECTION))),
    getDocs(query(collection(firestore, "ideas"),   orderBy("createdAt", "desc"), limit(MAX_PER_COLLECTION))),
    getDocs(query(collection(firestore, "events"),  orderBy("when", "desc"),      limit(MAX_PER_COLLECTION)))
  ]);

  const map = (coll: "signals"|"ideas"|"events") => (d: any) => ({
    id: d.id,
    title: d.data().title || "",
    desc: d.data().desc || "",
    createdAt: d.data().createdAt || d.data().when || 0,
    updatedAt: d.data().updatedAt || 0,
    type: d.data().type,
    status: d.data().status,
    where: d.data().where,
    when: d.data().when,
    collection: coll
  } as BaseDoc);

  const data = [
    ...s.docs.map(map("signals")),
    ...i.docs.map(map("ideas")),
    ...e.docs.map(map("events"))
  ];

  safeWrite(data);
  return data;
}

function safeRead(): BaseDoc[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    // Cache validity check using CACHE_DURATION
    if (Date.now() - (obj.ts || 0) > CACHE_DURATION) {
      // Clear expired cache
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return obj.data || null;
  } catch { 
    // Clear corrupted cache
    localStorage.removeItem(CACHE_KEY);
    return null; 
  }
}

export function safeWrite(data: BaseDoc[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

export function clearSearchCache() {
  localStorage.removeItem(CACHE_KEY);
}

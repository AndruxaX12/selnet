"use client";
import { normalizeRows } from "./normalize";
import { saveCache } from "./cache";
import { Doc } from "@/types/search";

export async function fetchAll(): Promise<Doc[]> {
  const [s, i, e] = await Promise.all([
    fetch("/api/public/list?coll=signals&limit=2000").then(r => r.json()).then(j => normalizeRows(j.rows || [], "signals")),
    fetch("/api/public/list?coll=ideas&limit=2000").then(r => r.json()).then(j => normalizeRows(j.rows || [], "ideas")),
    fetch("/api/public/list?coll=events&limit=2000").then(r => r.json()).then(j => normalizeRows(j.rows || [], "events"))
  ]);
  const docs = [...s, ...i, ...e];
  await saveCache(docs);
  return docs;
}

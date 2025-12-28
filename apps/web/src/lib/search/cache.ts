"use client";
import { set, get, del } from "idb-keyval";
import { Doc } from "@/types/search";

const KEY = "selnet.search.cache.v1";

export async function saveCache(docs: Doc[]) { 
  await set(KEY, docs); 
}

export async function loadCache(): Promise<Doc[] | null> { 
  return (await get(KEY)) || null; 
}

export async function clearCache() { 
  await del(KEY); 
}

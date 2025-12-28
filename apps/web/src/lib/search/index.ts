"use client";
import MiniSearch, { Options, SearchResult } from "minisearch";
import type { BaseDoc } from "@/lib/fetchCollections";

let mini: MiniSearch<BaseDoc> | null = null;

export function buildIndex(docs: BaseDoc[]) {
  mini = new MiniSearch<BaseDoc>({
    fields: ["title", "desc"],
    storeFields: ["id", "title", "desc", "collection", "createdAt", "status", "type", "where", "when"],
    searchOptions: {
      boost: { title: 3, desc: 1 },
      prefix: true, 
      fuzzy: 0.2
    } as Options<BaseDoc>["searchOptions"]
  });
  mini.addAll(docs);
  return mini;
}

export function getIndex() { return mini; }

export type Hit = SearchResult & { item: BaseDoc };

export function highlight(text: string, terms: string[]): string {
  if (!text) return "";
  let out = text;
  terms
    .filter(t => t.length > 1)
    .forEach((t) => {
      const re = new RegExp(`(${escapeRegExp(t)})` , "ig");
      out = out.replace(re, "<mark>$1</mark>");
    });
  return out;
}

function escapeRegExp(s: string) { 
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); 
}

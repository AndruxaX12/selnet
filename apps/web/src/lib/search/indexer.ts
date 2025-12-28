"use client";
import MiniSearch from "minisearch";
import { Doc } from "@/types/search";

export type IndexBundle = {
  mini: MiniSearch<Doc>;
  docs: Doc[];
};

export function buildIndex(docs: Doc[]): IndexBundle {
  const mini = new MiniSearch<Doc>({
    fields: ["title", "desc", "settlementLabel"],
    storeFields: ["id","type","title","desc","settlementLabel","when","createdAt","url"],
    searchOptions: {
      boost: { title: 3, settlementLabel: 1.2 },
      prefix: true, 
      fuzzy: 0.15
    }
  });
  mini.addAll(docs);
  return { mini, docs };
}

export type Facets = {
  type?: "all"|"signals"|"ideas"|"events";
  q?: string;
  settlement?: string;
  from?: number; // ts
  to?: number;   // ts
};

export function applyFacets(rows: Doc[], f: Facets) {
  let out = rows;
  if (f.type && f.type !== "all") out = out.filter(r => r.type === f.type);
  if (f.settlement) {
    const s = f.settlement.toLowerCase();
    out = out.filter(r => (r.settlementLabel||"").toLowerCase().includes(s) || (r.settlementId||"")===f.settlement);
  }
  if (f.from) out = out.filter(r => (r.when || r.createdAt || 0) >= f.from!);
  if (f.to)   out = out.filter(r => (r.when || r.createdAt || 0) <= f.to!);
  return out;
}

export function search(bundle: IndexBundle, f: Facets) {
  const base = f.q?.trim() ? bundle.mini.search(f.q!, { combineWith: "AND" }).map(r => r as any as Doc) : bundle.docs;
  return applyFacets(base, f);
}

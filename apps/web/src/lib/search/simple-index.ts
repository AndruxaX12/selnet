"use client";
import type { BaseDoc } from "@/lib/fetchCollections";

let searchData: BaseDoc[] = [];

export function buildIndex(docs: BaseDoc[]) {
  searchData = docs;
  return searchData;
}

export function getIndex() { 
  return { search: simpleSearch }; 
}

export type Hit = { 
  id: string;
  score: number;
  item: BaseDoc;
  title: string;
  desc?: string;
  collection: string;
  createdAt?: number;
  status?: string;
  type?: string;
  where?: string;
  when?: number;
};

function simpleSearch(query: string): Hit[] {
  if (!query.trim()) return [];
  
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: Hit[] = [];
  
  searchData.forEach(doc => {
    let score = 0;
    const titleLower = (doc.title || "").toLowerCase();
    const descLower = (doc.desc || "").toLowerCase();
    
    terms.forEach(term => {
      // Title matches get higher score
      if (titleLower.includes(term)) {
        score += 3;
      }
      // Description matches get lower score
      if (descLower.includes(term)) {
        score += 1;
      }
    });
    
    if (score > 0) {
      results.push({
        id: doc.id,
        score,
        item: doc,
        title: doc.title,
        desc: doc.desc,
        collection: doc.collection,
        createdAt: doc.createdAt,
        status: doc.status,
        type: doc.type,
        where: doc.where,
        when: doc.when
      });
    }
  });
  
  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

export function highlight(text: string, terms: string[]): string {
  if (!text) return "";
  let out = text;
  terms
    .filter(t => t.length > 1)
    .forEach((t) => {
      const re = new RegExp(`(${escapeRegExp(t)})`, "ig");
      out = out.replace(re, "<mark>$1</mark>");
    });
  return out;
}

function escapeRegExp(s: string) { 
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); 
}

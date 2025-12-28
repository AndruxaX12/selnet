"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchAllForSearch, BaseDoc } from "./fetchCollections";
import { buildIndex, getIndex, Hit } from "./search/simple-index";

export function useSearch() {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<BaseDoc[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchAllForSearch();
      setDocs(data);
      buildIndex(data);
      setReady(true);
      setLoading(false);
    })();
  }, []);

  function query(q: string, filter?: { collection?: "signals"|"ideas"|"events" }) {
    const idx = getIndex();
    if (!idx || !q.trim()) return [];
    let hits = idx.search(q) as Hit[];
    if (filter?.collection) hits = hits.filter((h) => (h.item.collection === filter.collection));
    return hits;
  }

  return { loading, ready, docs, query };
}

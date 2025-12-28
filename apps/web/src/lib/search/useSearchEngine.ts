"use client";
import { useEffect, useState } from "react";
import { buildIndex, search, type IndexBundle, type Facets } from "./indexer";
import { loadCache } from "./cache";
import { fetchAll } from "./source";
import { Doc } from "@/types/search";

export function useSearchEngine() {
  const [bundle, setBundle] = useState<IndexBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let docs = await loadCache();
      if (!docs) docs = await fetchAll();
      setBundle(buildIndex(docs));
      setCount(docs.length);
      setLoading(false);
    })();
  }, []);

  async function rebuild() {
    setRebuilding(true);
    const docs = await fetchAll();
    setBundle(buildIndex(docs));
    setCount(docs.length);
    setRebuilding(false);
  }

  function run(f: Facets) {
    if (!bundle) return [];
    return search(bundle, f);
  }

  return { bundle, loading, rebuilding, count, rebuild, run };
}

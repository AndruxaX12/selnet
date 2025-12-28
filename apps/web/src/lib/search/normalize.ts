import { Doc, SearchType } from "@/types/search";

export function normalizeRows(rows: any[], type: SearchType): Doc[] {
  return rows.map(r => ({
    id: r.id,
    type,
    title: r.title || "",
    desc: r.desc || "",
    settlementId: r.settlementId || "",
    settlementLabel: r.settlementLabel || "",
    when: type === "events" ? Number(r.when || 0) : undefined,
    createdAt: type !== "events" ? Number(r.createdAt || 0) : undefined,
    url: r.url
  }));
}

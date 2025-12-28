export type SearchType = "signals" | "ideas" | "events";

export type Doc = {
  id: string;
  type: SearchType;
  title: string;
  desc?: string;
  settlementId?: string;
  settlementLabel?: string;
  when?: number;        // events
  createdAt?: number;   // signals/ideas
  url: string;
};

import { z } from "zod";

export type Role = "resident" | "coordinator" | "municipal" | "admin";
export type SignalStatus = "new" | "in_progress" | "resolved" | "rejected" | "overdue";

export type Photo = {
  url: string;          // download URL
  path?: string;        // gs path в Storage (напр. "signals/123-abc.jpg")
  unsafe?: boolean;     // маркировка от модерацията
  blurredUrl?: string;  // download URL към размазана версия
};

export type Comment = {
  id?: string;
  by: string;          // uid
  text: string;
  createdAt: number;
  editedAt?: number;
  likesCount?: number; // aggregate
  parentId?: string;   // for threads (later)
};

export type CommentWithId = Comment & { id: string };

export type IdeaVote = {
  v: 1 | -1;
  at: number;
};

export type HistoryEntry = {
  id?: string;
  at: number;           // timestamp
  by?: string | null;   // uid или null (система)
  type: "status"|"edit"|"note"|"photo_mod"|"import"|"create";
  msg: string;          // човешко описание
  diff?: Record<string, any>; // по избор: структурни промени
};

export interface FirestoreBase {
  id?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Signal extends FirestoreBase {
  title: string;
  desc: string;
  photos?: Array<string | Photo>; // за обратна съвместимост
  status: SignalStatus;
  type: string; // категория: път, осветление, чистота ...
  settlementId: string;
  geo?: { lat: number; lng: number };
  authorUid?: string;
  anonymous?: boolean;
}

export interface Idea extends FirestoreBase {
  title: string;
  desc: string;
  settlementId: string;
  authorUid: string;
  votesCount: number;
  status: "new" | "hot" | "accepted" | "rejected";
  score?: number;      // aggregate: upCount - downCount
  upCount?: number;    // aggregate: number of upvotes
  downCount?: number;  // aggregate: number of downvotes
}

export interface EventItem extends FirestoreBase {
  title: string;
  desc: string;
  when: number; // timestamp ms
  where?: string;
  settlementId: string;
  geo?: { lat: number; lng: number };
  cover?: string; // storage url
  createdBy: string; // uid
}

/** Zod schemas (for forms/validation) */
export const zPhoto = z.object({
  url: z.string().url(),
  path: z.string().optional(),
  unsafe: z.boolean().optional(),
  blurredUrl: z.string().url().optional()
});

export const zSignal = z.object({
  title: z.string().min(5).max(100),
  desc: z.string().min(10).max(1000),
  type: z.string().min(2).max(30),
  settlementId: z.string().min(2),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  photos: z.array(z.union([z.string().url(), zPhoto])).optional(),
  anonymous: z.boolean().optional()
});

export const zIdea = z.object({
  title: z.string().min(5).max(100),
  desc: z.string().min(10).max(1000),
  settlementId: z.string().min(2)
});

export const zEvent = z.object({
  title: z.string().min(3).max(100),
  desc: z.string().min(10).max(1200),
  when: z.number().int().positive(),
  settlementId: z.string().min(2),
  where: z.string().optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  cover: z.string().url().optional()
});

export * from "./moderation";

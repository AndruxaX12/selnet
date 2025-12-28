export type Settlement = {
  id?: string;
  name: string;          // напр. "Монтана"
  kind?: "city"|"town"|"village"|"district"|"other";
  municipality?: string; // община
  province?: string;     // област
  country?: "BG";
  center: { lat: number; lng: number };
  bounds?: { ne: {lat:number;lng:number}; sw: {lat:number;lng:number} };
  search?: string;       // name + municipality + province (lowercase, за бързо търсене)
  createdAt?: number;
  updatedAt?: number;
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

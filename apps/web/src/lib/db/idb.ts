"use client";
import { openDB, DBSchema, IDBPDatabase } from "idb";

export type Coll = "signals"|"ideas"|"events"|"settlements";
export type AnyDoc = { id: string; updatedAt?: number; createdAt?: number } & Record<string, any>;

interface SelnetDB extends DBSchema {
  signals:      { key: string; value: AnyDoc; indexes: { "by-updatedAt": number } };
  ideas:        { key: string; value: AnyDoc; indexes: { "by-updatedAt": number } };
  events:       { key: string; value: AnyDoc; indexes: { "by-when": number; "by-updatedAt": number } };
  settlements:  { key: string; value: AnyDoc; indexes: { "by-name": string } };
  meta:         { key: string; value: { key: string; value: any } };
  queue:        { key: string; value: AnyDoc }; // pending writes (light)
}

let _db: Promise<IDBPDatabase<SelnetDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SelnetDB>> {
  if (!_db) {
    _db = openDB<SelnetDB>("selnet-idb", 3, {
      upgrade(db: any) {
        const mk = (name: keyof SelnetDB, idx?: [string, string][], keyPath = "id") => {
          if (db.objectStoreNames.contains(name)) return;
          const os = db.createObjectStore(name, { keyPath });
          (idx||[]).forEach(([n, f]) => os.createIndex(n, f));
        };
        mk("signals", [["by-updatedAt","updatedAt"]]);
        mk("ideas",   [["by-updatedAt","updatedAt"]]);
        mk("events",  [["by-when","when"], ["by-updatedAt","updatedAt"]]);
        mk("settlements", [["by-name","name"]]);
        mk("meta", [], "key");
        mk("queue", [], "id");
      }
    });
  }
  return _db!;
}

export async function idbPut(coll: Coll, docs: AnyDoc[]) {
  const db = await getDB();
  const tx = db.transaction(coll, "readwrite");
  for (const d of docs) await tx.store.put(d);
  await tx.done;
}

export async function idbGetAll(coll: Coll, limit = 1000): Promise<AnyDoc[]> {
  const db = await getDB();
  const store = db.transaction(coll).store;
  // бързо: вземи всички и сортирай по updatedAt desc
  const all = await store.getAll();
  return all.sort((a: AnyDoc, b: AnyDoc)=> (b.updatedAt||0) - (a.updatedAt||0)).slice(0, limit);
}

export async function idbGet(coll: Coll, id: string): Promise<AnyDoc | undefined> {
  const db = await getDB();
  return db.transaction(coll).store.get(id);
}

export async function idbSetMeta(key: string, value: any) {
  const db = await getDB();
  const metaObject = { key, value };
  await db.put("meta", metaObject);
}
export async function idbGetMeta<T=any>(key: string): Promise<T|undefined> {
  const db = await getDB();
  const v = await db.get("meta", key);
  return v?.value as T | undefined;
}

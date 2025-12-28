declare module 'idb' {
  export interface DBSchema {
    [key: string]: {
      key: string;
      value: any;
      indexes?: Record<string, string | number>;
    };
  }

  export interface IDBPDatabase<DBTypes extends DBSchema> {
    put<T extends keyof DBTypes>(
      table: T,
      value: DBTypes[T]['value'],
      key?: string
    ): Promise<DBTypes[T]['key']>;
    get<T extends keyof DBTypes>(
      table: T,
      key: string
    ): Promise<DBTypes[T]['value'] | undefined>;
    getAll<T extends keyof DBTypes>(
      table: T,
      query?: IDBKeyRange | null,
      count?: number
    ): Promise<DBTypes[T]['value'][]>;
    delete<T extends keyof DBTypes>(
      table: T,
      key: string
    ): Promise<void>;
    transaction<T extends keyof DBTypes>(
      table: T | T[],
      mode?: IDBTransactionMode
    ): {
      store: IDBPObjectStore<DBTypes, T>;
      done: Promise<void>;
    };
  }

  export interface IDBPObjectStore<DBTypes extends DBSchema, T extends keyof DBTypes> {
    put(value: DBTypes[T]['value'], key?: string): Promise<DBTypes[T]['key']>;
    get(key: string): Promise<DBTypes[T]['value'] | undefined>;
    getAll(): Promise<DBTypes[T]['value'][]>;
    delete(key: string): Promise<void>;
  }

  export function openDB<DBTypes extends DBSchema>(
    name: string,
    version: number,
    options?: {
      upgrade?: (db: IDBDatabase, oldVersion: number, newVersion: number | null, transaction: IDBTransaction) => void;
    }
  ): Promise<IDBPDatabase<DBTypes>>;
}

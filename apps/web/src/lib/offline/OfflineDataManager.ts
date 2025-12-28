"use client";

interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineData {
  [collection: string]: {
    [id: string]: {
      data: any;
      timestamp: number;
      synced: boolean;
    };
  };
}

class OfflineDataManager {
  private dbName = 'selnet-offline';
  private version = 1;
  private db: IDBDatabase | null = null;
  private isOnline = true;
  private syncQueue: OfflineAction[] = [];
  private syncInProgress = false;

  constructor() {
    this.initDB();
    this.setupOnlineListener();
    this.loadSyncQueue();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for cached data
        if (!db.objectStoreNames.contains('data')) {
          const dataStore = db.createObjectStore('data', { keyPath: 'id' });
          dataStore.createIndex('collection', 'collection', { unique: false });
          dataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for pending actions
        if (!db.objectStoreNames.contains('actions')) {
          const actionsStore = db.createObjectStore('actions', { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  private setupOnlineListener(): void {
    if (typeof window === 'undefined') return;

    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      console.log('Back online - starting sync');
      this.isOnline = true;
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      console.log('Gone offline - queuing actions');
      this.isOnline = false;
    });
  }

  private async loadSyncQueue(): Promise<void> {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction(['actions'], 'readonly');
    const store = transaction.objectStore('actions');
    const request = store.getAll();

    request.onsuccess = () => {
      this.syncQueue = request.result || [];
      console.log(`Loaded ${this.syncQueue.length} pending actions`);
    };
  }

  // Get data from cache or network
  async getData(collection: string, id?: string): Promise<any> {
    if (!this.db) await this.initDB();

    // Try to get from cache first
    const cachedData = await this.getCachedData(collection, id);
    
    if (this.isOnline) {
      // Try to fetch fresh data
      try {
        const freshData = await this.fetchFromNetwork(collection, id);
        if (freshData) {
          await this.cacheData(collection, freshData);
          return freshData;
        }
      } catch (error) {
        console.log('Network fetch failed, using cached data:', error);
      }
    }

    return cachedData;
  }

  // Cache data locally
  async cacheData(collection: string, data: any | any[]): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    const timestamp = Date.now();

    if (Array.isArray(data)) {
      for (const item of data) {
        const cacheItem = {
          id: `${collection}-${item.id}`,
          collection,
          data: item,
          timestamp,
          synced: true
        };
        store.put(cacheItem);
      }
    } else {
      const cacheItem = {
        id: `${collection}-${data.id}`,
        collection,
        data,
        timestamp,
        synced: true
      };
      store.put(cacheItem);
    }
  }

  // Get cached data
  private async getCachedData(collection: string, id?: string): Promise<any> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');

    if (id) {
      const request = store.get(`${collection}-${id}`);
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        request.onerror = () => resolve(null);
      });
    } else {
      const index = store.index('collection');
      const request = index.getAll(collection);
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const results = request.result || [];
          resolve(results.map(item => item.data));
        };
        request.onerror = () => resolve([]);
      });
    }
  }

  // Create/Update/Delete operations
  async createItem(collection: string, data: any): Promise<string> {
    const id = data.id || this.generateId();
    const action: OfflineAction = {
      id: this.generateId(),
      type: 'CREATE',
      collection,
      data: { ...data, id },
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    // Cache locally immediately
    await this.cacheData(collection, { ...data, id });

    if (this.isOnline) {
      try {
        await this.executeAction(action);
        return id;
      } catch (error) {
        console.log('Create failed, queuing for later:', error);
        await this.queueAction(action);
      }
    } else {
      await this.queueAction(action);
    }

    return id;
  }

  async updateItem(collection: string, id: string, data: any): Promise<void> {
    const action: OfflineAction = {
      id: this.generateId(),
      type: 'UPDATE',
      collection,
      data: { ...data, id },
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    // Update cache immediately
    await this.cacheData(collection, { ...data, id });

    if (this.isOnline) {
      try {
        await this.executeAction(action);
      } catch (error) {
        console.log('Update failed, queuing for later:', error);
        await this.queueAction(action);
      }
    } else {
      await this.queueAction(action);
    }
  }

  async deleteItem(collection: string, id: string): Promise<void> {
    const action: OfflineAction = {
      id: this.generateId(),
      type: 'DELETE',
      collection,
      data: { id },
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    // Remove from cache immediately
    await this.removeCachedItem(collection, id);

    if (this.isOnline) {
      try {
        await this.executeAction(action);
      } catch (error) {
        console.log('Delete failed, queuing for later:', error);
        await this.queueAction(action);
      }
    } else {
      await this.queueAction(action);
    }
  }

  // Execute action against network
  private async executeAction(action: OfflineAction): Promise<void> {
    const { type, collection, data } = action;
    const endpoint = `/api/${collection}`;

    let response: Response;

    switch (type) {
      case 'CREATE':
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        break;

      case 'UPDATE':
        response = await fetch(`${endpoint}/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        break;

      case 'DELETE':
        response = await fetch(`${endpoint}/${data.id}`, {
          method: 'DELETE'
        });
        break;

      default:
        throw new Error(`Unknown action type: ${type}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Queue action for later execution
  private async queueAction(action: OfflineAction): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['actions'], 'readwrite');
    const store = transaction.objectStore('actions');
    
    store.put(action);
    this.syncQueue.push(action);

    console.log(`Queued ${action.type} action for ${action.collection}`);
  }

  // Sync all pending actions
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`Syncing ${this.syncQueue.length} pending actions`);

    const actionsToRemove: string[] = [];

    for (const action of this.syncQueue) {
      try {
        await this.executeAction(action);
        actionsToRemove.push(action.id);
        console.log(`Synced ${action.type} for ${action.collection}`);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        
        action.retryCount++;
        if (action.retryCount >= action.maxRetries) {
          console.error(`Max retries reached for action ${action.id}, removing`);
          actionsToRemove.push(action.id);
        }
      }
    }

    // Remove completed/failed actions
    await this.removeCompletedActions(actionsToRemove);
    this.syncQueue = this.syncQueue.filter(action => !actionsToRemove.includes(action.id));

    this.syncInProgress = false;
    console.log('Sync completed');
  }

  // Helper methods
  private async fetchFromNetwork(collection: string, id?: string): Promise<any> {
    const endpoint = id ? `/api/${collection}/${id}` : `/api/${collection}`;
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }

  private async removeCachedItem(collection: string, id: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    store.delete(`${collection}-${id}`);
  }

  private async removeCompletedActions(actionIds: string[]): Promise<void> {
    if (!this.db || actionIds.length === 0) return;

    const transaction = this.db.transaction(['actions'], 'readwrite');
    const store = transaction.objectStore('actions');
    
    for (const id of actionIds) {
      store.delete(id);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get sync status
  getSyncStatus(): { pending: number; isOnline: boolean; syncing: boolean } {
    return {
      pending: this.syncQueue.length,
      isOnline: this.isOnline,
      syncing: this.syncInProgress
    };
  }

  // Clear all cached data (for testing/reset)
  async clearCache(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['data', 'actions'], 'readwrite');
    const dataStore = transaction.objectStore('data');
    const actionsStore = transaction.objectStore('actions');
    
    dataStore.clear();
    actionsStore.clear();
    this.syncQueue = [];
    
    console.log('Cache cleared');
  }
}

// Export singleton instance
export const offlineDataManager = new OfflineDataManager();

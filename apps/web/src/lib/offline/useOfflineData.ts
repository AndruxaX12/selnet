"use client";
import { useState, useEffect, useCallback } from 'react';
import { offlineDataManager } from './OfflineDataManager';

interface UseOfflineDataOptions {
  autoSync?: boolean;
  syncInterval?: number;
  cacheFirst?: boolean;
}

interface UseOfflineDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  syncStatus: {
    pending: number;
    isOnline: boolean;
    syncing: boolean;
  };
  actions: {
    create: (item: Partial<T>) => Promise<string>;
    update: (id: string, item: Partial<T>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
    sync: () => Promise<void>;
  };
}

export function useOfflineData<T extends { id: string }>(
  collection: string,
  options: UseOfflineDataOptions = {}
): UseOfflineDataReturn<T> {
  const {
    autoSync = true,
    syncInterval = 30000, // 30 seconds
    cacheFirst = true
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    isOnline: true,
    syncing: false
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await offlineDataManager.getData(collection);
      setData(Array.isArray(result) ? result : result ? [result] : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [collection]);

  // Update sync status
  const updateSyncStatus = useCallback(() => {
    setSyncStatus(offlineDataManager.getSyncStatus());
  }, []);

  // Create item
  const create = useCallback(async (item: Partial<T>): Promise<string> => {
    try {
      const id = await offlineDataManager.createItem(collection, item);
      await loadData(); // Refresh data
      updateSyncStatus();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      throw err;
    }
  }, [collection, loadData, updateSyncStatus]);

  // Update item
  const update = useCallback(async (id: string, item: Partial<T>): Promise<void> => {
    try {
      await offlineDataManager.updateItem(collection, id, item);
      await loadData(); // Refresh data
      updateSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    }
  }, [collection, loadData, updateSyncStatus]);

  // Delete item
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    try {
      await offlineDataManager.deleteItem(collection, id);
      await loadData(); // Refresh data
      updateSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    }
  }, [collection, loadData, updateSyncStatus]);

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    await loadData();
    updateSyncStatus();
  }, [loadData, updateSyncStatus]);

  // Manual sync
  const sync = useCallback(async (): Promise<void> => {
    try {
      await offlineDataManager.syncPendingActions();
      await loadData(); // Refresh after sync
      updateSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync');
      throw err;
    }
  }, [loadData, updateSyncStatus]);

  // Initial load
  useEffect(() => {
    loadData();
    updateSyncStatus();
  }, [loadData, updateSyncStatus]);

  // Auto sync interval
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(() => {
      offlineDataManager.syncPendingActions().then(() => {
        updateSyncStatus();
      });
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, updateSyncStatus]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      updateSyncStatus();
      if (autoSync) {
        offlineDataManager.syncPendingActions().then(() => {
          loadData();
          updateSyncStatus();
        });
      }
    };

    const handleOffline = () => {
      updateSyncStatus();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [autoSync, loadData, updateSyncStatus]);

  return {
    data,
    loading,
    error,
    syncStatus,
    actions: {
      create,
      update,
      delete: deleteItem,
      refresh,
      sync
    }
  };
}

// Hook for single item
export function useOfflineItem<T extends { id: string }>(
  collection: string,
  id: string,
  options: UseOfflineDataOptions = {}
): Omit<UseOfflineDataReturn<T>, 'data'> & { data: T | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    isOnline: true,
    syncing: false
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await offlineDataManager.getData(collection, id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item');
      console.error('Error loading item:', err);
    } finally {
      setLoading(false);
    }
  }, [collection, id]);

  const updateSyncStatus = useCallback(() => {
    setSyncStatus(offlineDataManager.getSyncStatus());
  }, []);

  const update = useCallback(async (itemId: string, item: Partial<T>): Promise<void> => {
    try {
      await offlineDataManager.updateItem(collection, itemId, item);
      await loadData();
      updateSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    }
  }, [collection, loadData, updateSyncStatus]);

  const deleteItem = useCallback(async (): Promise<void> => {
    try {
      await offlineDataManager.deleteItem(collection, id);
      setData(null);
      updateSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    }
  }, [collection, id, updateSyncStatus]);

  const refresh = useCallback(async (): Promise<void> => {
    await loadData();
    updateSyncStatus();
  }, [loadData, updateSyncStatus]);

  const sync = useCallback(async (): Promise<void> => {
    try {
      await offlineDataManager.syncPendingActions();
      await loadData();
      updateSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync');
      throw err;
    }
  }, [loadData, updateSyncStatus]);

  useEffect(() => {
    loadData();
    updateSyncStatus();
  }, [loadData, updateSyncStatus]);

  return {
    data,
    loading,
    error,
    syncStatus,
    actions: {
      create: async () => { throw new Error('Create not available for single item'); },
      update,
      delete: deleteItem,
      refresh,
      sync
    }
  };
}

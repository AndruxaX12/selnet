"use client";
import { useState, useEffect } from 'react';
import { offlineDataManager } from '@/lib/offline/OfflineDataManager';

interface SyncStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function SyncStatus({ showDetails = false, className = '' }: SyncStatusProps) {
  const [status, setStatus] = useState({
    pending: 0,
    isOnline: true,
    syncing: false
  });
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(offlineDataManager.getSyncStatus());
    };

    // Update status initially
    updateStatus();

    // Update status periodically
    const interval = setInterval(updateStatus, 1000);

    // Listen for online/offline events
    const handleOnline = () => {
      updateStatus();
      setLastSync(new Date());
    };

    const handleOffline = () => {
      updateStatus();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const handleSync = async () => {
    try {
      await offlineDataManager.syncPendingActions();
      setLastSync(new Date());
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const getStatusIcon = () => {
    if (status.syncing) return '🔄';
    if (!status.isOnline) return '📴';
    if (status.pending > 0) return '⏳';
    return '✅';
  };

  const getStatusText = () => {
    if (status.syncing) return 'Синхронизира...';
    if (!status.isOnline) return 'Офлайн режим';
    if (status.pending > 0) return `${status.pending} в опашката`;
    return 'Синхронизирано';
  };

  const getStatusColor = () => {
    if (status.syncing) return 'text-blue-600';
    if (!status.isOnline) return 'text-orange-600';
    if (status.pending > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!showDetails && status.isOnline && status.pending === 0 && !status.syncing) {
    return null; // Hide when everything is fine
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <span className="text-lg" role="img" aria-label="sync status">
          {getStatusIcon()}
        </span>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {showDetails && (
        <div className="flex items-center space-x-2">
          {status.pending > 0 && status.isOnline && (
            <button
              onClick={handleSync}
              disabled={status.syncing}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              {status.syncing ? 'Синхронизира...' : 'Синхронизирай'}
            </button>
          )}

          {lastSync && (
            <span className="text-xs text-gray-500">
              Последна синхронизация: {lastSync.toLocaleTimeString('bg-BG')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for mobile
export function CompactSyncStatus({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState({
    pending: 0,
    isOnline: true,
    syncing: false
  });

  useEffect(() => {
    const updateStatus = () => {
      setStatus(offlineDataManager.getSyncStatus());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  if (status.isOnline && status.pending === 0 && !status.syncing) {
    return null;
  }

  const getIndicatorClass = () => {
    if (status.syncing) return 'bg-blue-500 animate-pulse';
    if (!status.isOnline) return 'bg-orange-500';
    if (status.pending > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`flex items-center ${className}`} title={
      status.syncing ? 'Синхронизира...' :
      !status.isOnline ? 'Офлайн режим' :
      status.pending > 0 ? `${status.pending} действия в опашката` :
      'Синхронизирано'
    }>
      <div className={`w-2 h-2 rounded-full ${getIndicatorClass()}`} />
      {status.pending > 0 && (
        <span className="ml-1 text-xs text-gray-600">{status.pending}</span>
      )}
    </div>
  );
}

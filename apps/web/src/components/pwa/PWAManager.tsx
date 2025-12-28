"use client";
import { useState, useEffect } from 'react';
import { useNotifications } from '@/lib/notifications/useNotifications';
import { performanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { platform } from '@/lib/mobile/platform';
import { offlineDataManager } from '@/lib/offline/OfflineDataManager';
import { vibrateLight, vibrateNotification } from '@/lib/mobile/haptics';

interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  notificationsEnabled: boolean;
  performanceScore: number;
  syncPending: number;
  lastSync: Date | null;
}

export default function PWAManager() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: true,
    notificationsEnabled: false,
    performanceScore: 100,
    syncPending: 0,
    lastSync: null
  });

  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { permission, isSubscribed } = useNotifications();

  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
      const syncStatus = offlineDataManager.getSyncStatus();
      
      setStatus(prev => ({
        ...prev,
        isInstalled: platform.isStandalone,
        isOnline: navigator.onLine,
        notificationsEnabled: permission === 'granted' && isSubscribed,
        performanceScore: performanceMonitor.getPerformanceScore(),
        syncPending: syncStatus.pending,
        lastSync: prev.lastSync // Keep existing value, update elsewhere
      }));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true, lastSync: new Date() }));
      vibrateLight();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      vibrateNotification();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [permission, isSubscribed]);

  // Handle app update
  const handleUpdate = async () => {
    setIsUpdating(true);
    vibrateLight();
    
    try {
      // Trigger service worker update
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        window.location.reload();
      }
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle manual sync
  const handleSync = async () => {
    vibrateLight();
    try {
      await offlineDataManager.syncPendingActions();
      setStatus(prev => ({ ...prev, lastSync: new Date() }));
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (!status.isOnline) return 'text-red-600';
    if (status.syncPending > 0) return 'text-yellow-600';
    if (status.performanceScore < 70) return 'text-orange-600';
    return 'text-green-600';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!status.isOnline) return '📴';
    if (status.syncPending > 0) return '⏳';
    if (status.performanceScore < 70) return '⚠️';
    return '✅';
  };

  // Get status text
  const getStatusText = () => {
    if (!status.isOnline) return 'Офлайн';
    if (status.syncPending > 0) return `${status.syncPending} в опашката`;
    if (status.performanceScore < 70) return 'Бавна работа';
    return 'Всичко е наред';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Status indicator */}
      <button
        onClick={() => {
          setShowDetails(!showDetails);
          vibrateLight();
        }}
        className={`flex items-center space-x-2 bg-white/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all ${getStatusColor()}`}
      >
        <span className="text-lg">{getStatusIcon()}</span>
        <span className="text-sm font-medium hidden sm:inline">
          {getStatusText()}
        </span>
      </button>

      {/* Details panel */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">PWA Статус</h3>
            <p className="text-sm text-gray-600">Преглед на състоянието на приложението</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Installation status */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Инсталация</div>
                <div className="text-sm text-gray-600">
                  {status.isInstalled ? 'Инсталирано като PWA' : 'Работи в браузър'}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${status.isInstalled ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>

            {/* Network status */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Мрежа</div>
                <div className="text-sm text-gray-600">
                  {status.isOnline ? 'Онлайн връзка' : 'Офлайн режим'}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>

            {/* Notifications status */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Известия</div>
                <div className="text-sm text-gray-600">
                  {status.notificationsEnabled ? 'Активни' : 'Неактивни'}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${status.notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>

            {/* Performance score */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Производителност</div>
                <div className="text-sm text-gray-600">
                  {status.performanceScore}/100 точки
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                status.performanceScore >= 90 ? 'bg-green-100 text-green-800' :
                status.performanceScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {status.performanceScore >= 90 ? 'Отлично' :
                 status.performanceScore >= 70 ? 'Добро' : 'Бавно'}
              </div>
            </div>

            {/* Sync status */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Синхронизация</div>
                <div className="text-sm text-gray-600">
                  {status.syncPending > 0 ? `${status.syncPending} в опашката` : 'Синхронизирано'}
                </div>
              </div>
              {status.syncPending > 0 && status.isOnline && (
                <button
                  onClick={handleSync}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                >
                  Синхронизирай
                </button>
              )}
            </div>

            {/* Last sync */}
            {status.lastSync && (
              <div className="text-xs text-gray-500 text-center">
                Последна синхронизация: {status.lastSync.toLocaleTimeString('bg-BG')}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t bg-gray-50 space-y-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isUpdating ? 'Обновява...' : 'Провери за обновления'}
            </button>

            <button
              onClick={() => {
                console.log(performanceMonitor.generateReport());
                vibrateLight();
              }}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Покажи performance отчет
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for mobile
export function CompactPWAStatus() {
  const [status, setStatus] = useState({
    isOnline: true,
    syncPending: 0,
    performanceScore: 100
  });

  useEffect(() => {
    const updateStatus = () => {
      const syncStatus = offlineDataManager.getSyncStatus();
      setStatus({
        isOnline: navigator.onLine,
        syncPending: syncStatus.pending,
        performanceScore: performanceMonitor.getPerformanceScore()
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const getIndicatorColor = () => {
    if (!status.isOnline) return 'bg-red-500';
    if (status.syncPending > 0) return 'bg-yellow-500';
    if (status.performanceScore < 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getIndicatorColor()}`} />
      {status.syncPending > 0 && (
        <span className="text-xs text-gray-600">{status.syncPending}</span>
      )}
    </div>
  );
}

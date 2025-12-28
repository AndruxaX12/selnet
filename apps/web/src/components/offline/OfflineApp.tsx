"use client";
import { useState, useEffect } from 'react';
import { useOfflineData } from '@/lib/offline/useOfflineData';
import { offlineDataManager } from '@/lib/offline/OfflineDataManager';
import { vibrateLight, vibrateSelection } from '@/lib/mobile/haptics';
import CameraUpload from '@/components/mobile/CameraUpload';
import SyncStatus from '@/components/offline/SyncStatus';

interface Signal {
  id: string;
  title: string;
  description: string;
  location?: string;
  images?: string[];
  timestamp: number;
  status: 'pending' | 'submitted' | 'resolved';
}

export default function OfflineApp() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNewSignal, setShowNewSignal] = useState(false);
  const [newSignal, setNewSignal] = useState<Partial<Signal>>({
    title: '',
    description: '',
    location: '',
    images: []
  });

  const {
    data: signals,
    loading,
    error,
    actions: { create, update, delete: deleteSignal, refresh, sync }
  } = useOfflineData<Signal>('signals');

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleCreateSignal = async () => {
    if (!newSignal.title || !newSignal.description) {
      vibrateSelection();
      alert('Моля попълнете заглавие и описание');
      return;
    }

    try {
      vibrateLight();
      const signal: Partial<Signal> = {
        ...newSignal,
        timestamp: Date.now(),
        status: isOnline ? 'submitted' : 'pending'
      };

      await create(signal);
      
      // Reset form
      setNewSignal({
        title: '',
        description: '',
        location: '',
        images: []
      });
      setShowNewSignal(false);

      if (!isOnline) {
        alert('Сигналът е запазен локално и ще бъде изпратен когато се върне интернет връзката.');
      }
    } catch (error) {
      console.error('Failed to create signal:', error);
      alert('Грешка при създаване на сигнал');
    }
  };

  const handleFileSelect = (files: File[]) => {
    // Convert files to base64 for offline storage
    const promises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(base64Images => {
      setNewSignal(prev => ({
        ...prev,
        images: [...(prev.images || []), ...base64Images]
      }));
    });
  };

  const handleDeleteSignal = async (id: string) => {
    if (confirm('Сигурни ли сте, че искате да изтриете този сигнал?')) {
      vibrateLight();
      try {
        await deleteSignal(id);
      } catch (error) {
        console.error('Failed to delete signal:', error);
        alert('Грешка при изтриване на сигнал');
      }
    }
  };

  const handleSync = async () => {
    vibrateSelection();
    try {
      await sync();
      alert('Синхронизацията завърши успешно');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Грешка при синхронизация');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">СелНет Офлайн</h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isOnline ? 'Онлайн' : 'Офлайн режим'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <SyncStatus showDetails />
              <button
                onClick={() => {
                  setShowNewSignal(true);
                  vibrateLight();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Нов сигнал
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* New Signal Form */}
        {showNewSignal && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Нов сигнал</h2>
              <button
                onClick={() => {
                  setShowNewSignal(false);
                  vibrateLight();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заглавие *
                </label>
                <input
                  type="text"
                  value={newSignal.title || ''}
                  onChange={(e) => setNewSignal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Кратко описание на проблема"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание *
                </label>
                <textarea
                  value={newSignal.description || ''}
                  onChange={(e) => setNewSignal(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Подробно описание на проблема"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Местоположение
                </label>
                <input
                  type="text"
                  value={newSignal.location || ''}
                  onChange={(e) => setNewSignal(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Адрес или описание на мястото"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Снимки
                </label>
                <CameraUpload
                  onFileSelect={handleFileSelect}
                  maxFiles={3}
                  maxSize={5}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateSignal}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isOnline ? 'Изпрати сигнал' : 'Запази локално'}
                </button>
                <button
                  onClick={() => {
                    setShowNewSignal(false);
                    vibrateLight();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отказ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signals List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Сигнали ({signals.length})</h2>
            <button
              onClick={handleSync}
              disabled={!isOnline}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              🔄 Синхронизирай
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">Зарежда сигнали...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Грешка: {error}</p>
            </div>
          )}

          {!loading && signals.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📡</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Няма сигнали</h3>
              <p className="text-gray-600 mb-4">Започнете като създадете първия си сигнал</p>
              <button
                onClick={() => {
                  setShowNewSignal(true);
                  vibrateLight();
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Създай сигнал
              </button>
            </div>
          )}

          {signals.map((signal) => (
            <div key={signal.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{signal.title}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    signal.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    signal.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {signal.status === 'resolved' ? 'Решен' :
                     signal.status === 'submitted' ? 'Изпратен' :
                     'Чака'}
                  </span>
                  <button
                    onClick={() => handleDeleteSignal(signal.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-2">{signal.description}</p>
              
              {signal.location && (
                <p className="text-gray-500 text-xs mb-2">📍 {signal.location}</p>
              )}
              
              {signal.images && signal.images.length > 0 && (
                <div className="flex space-x-2 mb-2">
                  {signal.images.slice(0, 3).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Снимка ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ))}
                  {signal.images.length > 3 && (
                    <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-600">
                      +{signal.images.length - 3}
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                {new Date(signal.timestamp).toLocaleString('bg-BG')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

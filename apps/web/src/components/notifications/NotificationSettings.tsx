"use client";
import { useState } from 'react';
import { useNotifications, useNotificationSettings } from '@/lib/notifications/useNotifications';
import { vibrateLight, vibrateSelection } from '@/lib/mobile/haptics';

interface NotificationSettingsProps {
  className?: string;
}

export default function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification
  } = useNotifications();

  const { settings, updateSettings } = useNotificationSettings();
  const [testLoading, setTestLoading] = useState(false);

  const handlePermissionRequest = async () => {
    vibrateLight();
    await requestPermission();
  };

  const handleSubscribe = async () => {
    vibrateSelection();
    await subscribe();
  };

  const handleUnsubscribe = async () => {
    vibrateLight();
    await unsubscribe();
  };

  const handleSettingChange = (setting: keyof typeof settings, value: boolean) => {
    vibrateLight();
    updateSettings({ [setting]: value });
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    vibrateSelection();
    
    try {
      await showNotification({
        title: 'Тест известие',
        body: 'Това е тестово известие от СелНет',
        icon: '/icons/icon-192.png',
        tag: 'test-notification',
        vibrate: [200, 100, 200]
      });
    } catch (error) {
      console.error('Failed to show test notification:', error);
    } finally {
      setTestLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <h3 className="font-semibold text-gray-800 mb-2">Известия</h3>
        <p className="text-sm text-gray-600">
          Вашият браузър не поддържа push известия.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Настройки за известия</h3>
        
        {/* Permission Status */}
        <div className="bg-white border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-800">Статус на разрешенията</h4>
              <p className="text-sm text-gray-600">
                {permission === 'granted' && 'Разрешени са известия'}
                {permission === 'denied' && 'Известията са блокирани'}
                {permission === 'default' && 'Не са поискани разрешения'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              permission === 'granted' ? 'bg-green-100 text-green-800' :
              permission === 'denied' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {permission === 'granted' && '✓ Разрешено'}
              {permission === 'denied' && '✗ Блокирано'}
              {permission === 'default' && '? Неизвестно'}
            </div>
          </div>

          {permission === 'default' && (
            <button
              onClick={handlePermissionRequest}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Зарежда...' : 'Разреши известия'}
            </button>
          )}

          {permission === 'denied' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                За да получавате известия, моля разрешете ги в настройките на браузъра.
              </p>
            </div>
          )}
        </div>

        {/* Subscription Status */}
        {permission === 'granted' && (
          <div className="bg-white border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-800">Push известия</h4>
                <p className="text-sm text-gray-600">
                  {isSubscribed ? 'Абонирани сте за push известия' : 'Не сте абонирани'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isSubscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isSubscribed ? '✓ Активни' : '○ Неактивни'}
              </div>
            </div>

            <div className="flex space-x-2">
              {!isSubscribed ? (
                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Абонира...' : 'Абонирай се'}
                </button>
              ) : (
                <button
                  onClick={handleUnsubscribe}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Отписва...' : 'Отпиши се'}
                </button>
              )}
              
              {isSubscribed && (
                <button
                  onClick={handleTestNotification}
                  disabled={testLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {testLoading ? 'Изпраща...' : 'Тест'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notification Types */}
        {permission === 'granted' && isSubscribed && (
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Типове известия</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Сигнали</label>
                  <p className="text-sm text-gray-600">Известия за нови сигнали в района</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.signals}
                    onChange={(e) => handleSettingChange('signals', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">События</label>
                  <p className="text-sm text-gray-600">Известия за предстоящи събития</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.events}
                    onChange={(e) => handleSettingChange('events', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Обновления</label>
                  <p className="text-sm text-gray-600">Известия за нови версии на приложението</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.updates}
                    onChange={(e) => handleSettingChange('updates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Маркетинг</label>
                  <p className="text-sm text-gray-600">Промоционални съобщения и новини</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.marketing}
                    onChange={(e) => handleSettingChange('marketing', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

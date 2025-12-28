"use client";
import { useState, useEffect } from "react";
import { usePushNotifications, PushNotificationPayload } from "@/lib/notify/pushManager";

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  showPreviews: boolean;
  priority: "normal" | "high" | "urgent";
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

export default function PushNotificationSettings() {
  const {
    permissionState,
    requestPermission,
    sendNotification,
    testNotification,
    isSupported
  } = usePushNotifications();

  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    soundEnabled: true,
    showPreviews: true,
    priority: "normal",
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState("");

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("pushNotificationSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Failed to parse saved notification settings:", error);
      }
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem("pushNotificationSettings", JSON.stringify(settings));
  }, [settings]);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const permission = await requestPermission();
      if (permission === "granted") {
        setSettings(prev => ({ ...prev, enabled: true }));
      }
    } catch (error) {
      console.error("Failed to request permission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!testMessage.trim()) {
      alert("Моля, въведете съобщение за теста");
      return;
    }

    setIsLoading(true);
    try {
      const payload: PushNotificationPayload = {
        title: "Тестово известие",
        body: testMessage,
        type: "system",
        priority: settings.priority,
        url: "/me/notifications",
        requireInteraction: settings.priority === "urgent"
      };

      await sendNotification(payload);
    } catch (error) {
      console.error("Failed to send test notification:", error);
      alert("Грешка при изпращане на тестовото известие");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  if (!isSupported) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800">Push известията не се поддържат</h3>
              <p className="text-sm text-yellow-700">
                Вашият браузър не поддържа push известия. Можете да използвате вътрешните известия в приложението.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Push известия</h2>

        {/* Permission Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                permissionState.permission === "granted" ? "bg-green-500" :
                permissionState.permission === "denied" ? "bg-red-500" : "bg-yellow-500"
              }`} />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {permissionState.permission === "granted" ? "Разрешени" :
                   permissionState.permission === "denied" ? "Забранени" : "Не е поискано разрешение"}
                </h3>
                <p className="text-sm text-gray-600">
                  {permissionState.serviceWorkerReady ?
                    "Service Worker е готов" :
                    "Service Worker се подготвя..."
                  }
                </p>
              </div>
            </div>

            {permissionState.permission !== "granted" && (
              <button
                onClick={handleRequestPermission}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "..." : "Поискай разрешение"}
              </button>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Настройки</h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">Push известия</span>
                <p className="text-sm text-gray-600">Получавайте известия дори когато приложението е затворено</p>
              </div>
              <button
                onClick={() => updateSettings({ enabled: !settings.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enabled ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">Звук</span>
                <p className="text-sm text-gray-600">Възпроизвеждане на звук при получаване на известие</p>
              </div>
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.soundEnabled ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">Покажи преглед</span>
                <p className="text-sm text-gray-600">Показване на съдържанието на известието в заключения екран</p>
              </div>
              <button
                onClick={() => updateSettings({ showPreviews: !settings.showPreviews })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showPreviews ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showPreviews ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            <div>
              <label className="block font-medium text-gray-900 mb-2">Приоритет</label>
              <select
                value={settings.priority}
                onChange={(e) => updateSettings({ priority: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normal">Нормален</option>
                <option value="high">Висок</option>
                <option value="urgent">Спешни</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Тихи часове</h3>

          <label className="flex items-center justify-between mb-4">
            <div>
              <span className="font-medium text-gray-900">Активирай тихи часове</span>
              <p className="text-sm text-gray-600">Без известия в определени часове</p>
            </div>
            <button
              onClick={() => updateSettings({
                quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled }
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.quietHours.enabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.quietHours.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>

          {settings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Начало</label>
                <input
                  type="time"
                  value={settings.quietHours.start}
                  onChange={(e) => updateSettings({
                    quietHours: { ...settings.quietHours, start: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Край</label>
                <input
                  type="time"
                  value={settings.quietHours.end}
                  onChange={(e) => updateSettings({
                    quietHours: { ...settings.quietHours, end: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Test Notification */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Тест</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Съобщение</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Въведете тестово съобщение..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <button
              onClick={handleTestNotification}
              disabled={isLoading || !testMessage.trim()}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Изпращане..." : "Изпрати тестово известие"}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Статус</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Разрешение: <span className="font-medium">{permissionState.permission}</span></p>
            <p>Service Worker: <span className="font-medium">
              {permissionState.serviceWorkerReady ? "Готов" : "Зарежда се..."}
            </span></p>
            <p>Push известия: <span className="font-medium">
              {settings.enabled ? "Активирани" : "Деактивирани"}
            </span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Mail, MessageSquare } from "lucide-react";

interface NotificationSettingsProps {
  user: any;
}

export default function NotificationSettings({ user }: NotificationSettingsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) return;

      const response = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationsEnabled(data.notificationsEnabled ?? true);
      }
    } catch (error) {
      console.error("Load settings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) return;

      const response = await fetch("/api/settings/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationsEnabled }),
      });

      if (!response.ok) throw new Error("Failed to save");

      alert("Настройките за известия са запазени!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Грешка при запазване");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Зареждане...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Настройки за известия
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Управлявайте как искате да получавате известия
      </p>

      {/* Main Toggle */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {notificationsEnabled ? (
                <Bell className="w-5 h-5 text-blue-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <h3 className="font-semibold text-gray-900">
                Активирай всички известия
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Главен превключвател за всички видове известия. Когато е изключен,
              няма да получавате никакви известия от платформата.
            </p>
          </div>
          <div className="ml-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Видове известия</h3>

        {/* Signal Updates */}
        <div className={`border rounded-lg p-4 ${notificationsEnabled ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
          <div className="flex items-start gap-3">
            <MessageSquare className={`w-5 h-5 mt-1 ${notificationsEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Актуализации на сигнали
              </h4>
              <p className="text-sm text-gray-600">
                Известия когато има промяна в статуса на вашите сигнали или нови коментари
              </p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded ${notificationsEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              {notificationsEnabled ? "Активни" : "Неактивни"}
            </span>
          </div>
        </div>

        {/* Location Alerts */}
        <div className={`border rounded-lg p-4 ${notificationsEnabled ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
          <div className="flex items-start gap-3">
            <Bell className={`w-5 h-5 mt-1 ${notificationsEnabled ? 'text-purple-600' : 'text-gray-400'}`} />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Локални предупреждения
              </h4>
              <p className="text-sm text-gray-600">
                Известия за важни събития във вашето населено място или улица
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Конфигурирайте от таб "Локация"
              </p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded ${notificationsEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              {notificationsEnabled ? "Активни" : "Неактивни"}
            </span>
          </div>
        </div>

        {/* Email Notifications */}
        <div className={`border rounded-lg p-4 ${notificationsEnabled ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
          <div className="flex items-start gap-3">
            <Mail className={`w-5 h-5 mt-1 ${notificationsEnabled ? 'text-orange-600' : 'text-gray-400'}`} />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Имейл известия
              </h4>
              <p className="text-sm text-gray-600">
                Получавайте email резюмета за важни събития (седмични дайджести)
              </p>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
              Скоро
            </span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>💡 Забележка:</strong> Push известията за браузъра се активират автоматично 
          след първото ви посещение. Проверете настройките на браузъра си, ако не получавате известия.
        </p>
      </div>

      {/* Save Button */}
      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium"
        >
          {saving ? "Запазване..." : "Запази настройките"}
        </button>
      </div>
    </div>
  );
}


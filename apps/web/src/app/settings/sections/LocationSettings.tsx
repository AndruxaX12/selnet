"use client";

import { useState, useEffect } from "react";
import { MapPin, Bell } from "lucide-react";
import { ALL_LOCATIONS } from "@/lib/constants/locations";
import { SubscriptionSettings } from "@/types/profile";

interface LocationSettingsProps {
  user: any;
}

export default function LocationSettings({ user }: LocationSettingsProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionSettings>({
    city: "",
    street: "",
    receiveCityAlerts: true,
    receiveStreetAlerts: false,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) return;

      const response = await fetch("/api/settings/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error("Load subscriptions error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!subscriptions.city) {
      alert("Моля изберете населено място");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) return;

      const response = await fetch("/api/settings/subscriptions/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscriptions),
      });

      if (!response.ok) throw new Error("Failed to save");

      alert("Настройките за локация са запазени!");
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
        Настройки за локация
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Изберете населеното място и адрес за персонализирани известия
      </p>

      {/* City Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline-block mr-2" />
          Населено място <span className="text-red-500">*</span>
        </label>
        <select
          value={subscriptions.city}
          onChange={(e) =>
            setSubscriptions({ ...subscriptions, city: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Избери населено място</option>
          {ALL_LOCATIONS.map((location) => (
            <option key={location.value} value={location.value}>
              {location.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-500">
          Изберете града или селото, в което живеете
        </p>
      </div>

      {/* Street Address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Точен адрес / Улица
        </label>
        <input
          type="text"
          value={subscriptions.street}
          onChange={(e) =>
            setSubscriptions({ ...subscriptions, street: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder='Например: ул. "Христо Ботев" 15'
        />
        <p className="mt-2 text-sm text-gray-500">
          Опционално - за още по-точни известия за вашия квартал
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Alert Preferences */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <Bell className="w-5 h-5 inline-block mr-2" />
          Известия за локация
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Изберете какви известия искате да получавате
        </p>

        {/* City Alerts Toggle */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Известия за населеното място
              </h4>
              <p className="text-sm text-gray-600">
                Получавайте известия за важни събития в {subscriptions.city || "вашето населено място"} 
                (аварии, планови спирания, общи съобщения)
              </p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={subscriptions.receiveCityAlerts}
                  onChange={(e) =>
                    setSubscriptions({
                      ...subscriptions,
                      receiveCityAlerts: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Street Alerts Toggle */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Известия за улицата
              </h4>
              <p className="text-sm text-gray-600">
                Получавайте известия специфични за вашата улица/квартал 
                {subscriptions.street ? ` (${subscriptions.street})` : " (попълнете адрес)"}
              </p>
              {!subscriptions.street && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Попълнете адрес, за да активирате тази опция
                </p>
              )}
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={subscriptions.receiveStreetAlerts}
                  onChange={(e) =>
                    setSubscriptions({
                      ...subscriptions,
                      receiveStreetAlerts: e.target.checked,
                    })
                  }
                  disabled={!subscriptions.street}
                  className="sr-only peer disabled:cursor-not-allowed"
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!subscriptions.street ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>💡 Как работи:</strong> Когато някой подаде сигнал във вашето населено място или улица, 
          ще получите push известие (ако функцията е активна).
        </p>
      </div>

      {/* Save Button */}
      <div>
        <button
          onClick={handleSave}
          disabled={saving || !subscriptions.city}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium"
        >
          {saving ? "Запазване..." : "Запази настройките"}
        </button>
      </div>
    </div>
  );
}


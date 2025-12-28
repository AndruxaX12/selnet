"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Loader2, Check, Sun, Moon, Monitor } from "lucide-react";

interface Preferences {
  date_format: "DD.MM.YYYY" | "YYYY-MM-DD";
  timezone: string;
  map_default: "list" | "map";
  theme: "light" | "dark" | "system";
}

export function PreferencesForm({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Preferences>({
    date_format: "DD.MM.YYYY",
    timezone: "Europe/Sofia",
    map_default: "list",
    theme: "system"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  async function fetchPreferences() {
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/profile", { headers });
      if (res.ok) {
        const profile = await res.json();
        setPrefs({
          date_format: profile.date_format || "DD.MM.YYYY",
          timezone: profile.timezone || "Europe/Sofia",
          map_default: profile.map_default || "list",
          theme: profile.theme || "system"
        });
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleChange(field: keyof Preferences, value: any) {
    const newPrefs = { ...prefs, [field]: value };
    setPrefs(newPrefs);
    setSuccess(false);
    
    // Auto-save
    await savePreferences(newPrefs);
  }

  async function savePreferences(newPrefs: Preferences) {
    setSaving(true);

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newPrefs)
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        
        // Apply theme immediately
        if (newPrefs.theme === "dark") {
          document.documentElement.classList.add("dark");
        } else if (newPrefs.theme === "light") {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setSaving(false);
    }
  }

  const previewDate = formatDateExample(new Date(), prefs.date_format);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Предпочитания</h2>
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Запазено
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Date & Time Section */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Формат на дата и час</h3>

          {/* Date Format */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-3">
              Формат на дата
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="radio"
                  name="date_format"
                  value="DD.MM.YYYY"
                  checked={prefs.date_format === "DD.MM.YYYY"}
                  onChange={(e) => handleChange("date_format", e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-600"
                />
                <span>DD.MM.YYYY (23.10.2025)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="radio"
                  name="date_format"
                  value="YYYY-MM-DD"
                  checked={prefs.date_format === "YYYY-MM-DD"}
                  onChange={(e) => handleChange("date_format", e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-600"
                />
                <span>YYYY-MM-DD (2025-10-23)</span>
              </label>
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Часова зона
            </label>
            <select
              id="timezone"
              value={prefs.timezone}
              onChange={(e) => handleChange("timezone", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            >
              <option value="Europe/Sofia">Europe/Sofia</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>

          {/* Preview */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Пример:</strong> {previewDate}
            </p>
          </div>
        </div>

        {/* View Defaults Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900">Изглед по подразбиране</h3>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-3">
              Показвай списъци като
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="radio"
                  name="map_default"
                  value="list"
                  checked={prefs.map_default === "list"}
                  onChange={(e) => handleChange("map_default", e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-600"
                />
                <span>📋 Списък</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="radio"
                  name="map_default"
                  value="map"
                  checked={prefs.map_default === "map"}
                  onChange={(e) => handleChange("map_default", e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-600"
                />
                <span>🗺️ Карта</span>
              </label>
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900">Визуално оформление</h3>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-3">
              Тема
            </span>
            <div className="grid grid-cols-3 gap-3">
              <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                prefs.theme === "light" ? "border-primary-600 bg-primary-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <Sun className="h-8 w-8" />
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={prefs.theme === "light"}
                  onChange={(e) => handleChange("theme", e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Светла</span>
              </label>

              <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                prefs.theme === "dark" ? "border-primary-600 bg-primary-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <Moon className="h-8 w-8" />
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={prefs.theme === "dark"}
                  onChange={(e) => handleChange("theme", e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Тъмна</span>
              </label>

              <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                prefs.theme === "system" ? "border-primary-600 bg-primary-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <Monitor className="h-8 w-8" />
                <input
                  type="radio"
                  name="theme"
                  value="system"
                  checked={prefs.theme === "system"}
                  onChange={(e) => handleChange("theme", e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Системна</span>
              </label>
            </div>
          </div>
        </div>

        {/* Saving Indicator */}
        {saving && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Запазване...
          </div>
        )}
      </div>
    </Card>
  );
}

function formatDateExample(date: Date, format: string): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (format === "DD.MM.YYYY") {
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } else {
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

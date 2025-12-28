"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Loader2, Check } from "lucide-react";

interface A11ySettings {
  locale: string;
  fontScale: number;
  reduceMotion: boolean;
}

export function AccessibilitySettings({ userId }: { userId: string }) {
  const [settings, setSettings] = useState<A11ySettings>({
    locale: "bg",
    fontScale: 100,
    reduceMotion: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  async function fetchSettings() {
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/profile", { headers });
      if (res.ok) {
        const profile = await res.json();
        setSettings({
          locale: profile.locale || "bg",
          fontScale: profile.a11y?.fontScale || 100,
          reduceMotion: profile.a11y?.reduceMotion || false
        });
      }
    } catch (err) {
      console.error("Failed to fetch accessibility settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleChange(updates: Partial<A11ySettings>) {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setSuccess(false);
    
    // Apply changes immediately
    applySettings(newSettings);
    
    // Auto-save
    await saveSettings(newSettings);
  }

  useEffect(() => {
    // Apply settings on mount
    applySettings(settings);
  }, [settings]);

  function applySettings(settings: A11ySettings) {
    // Apply font scale
    document.documentElement.style.fontSize = `${settings.fontScale}%`;
    
    // Apply reduce motion
    if (settings.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }

  async function saveSettings(newSettings: A11ySettings) {
    setSaving(true);

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          locale: newSettings.locale,
          a11y: {
            fontScale: newSettings.fontScale,
            reduceMotion: newSettings.reduceMotion
          }
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save accessibility settings:", err);
    } finally {
      setSaving(false);
    }
  }

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
        <h2 className="text-xl font-semibold text-gray-900">Език и достъпност</h2>
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Запазено
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Language Section */}
        <div>
          <label htmlFor="locale" className="block text-sm font-medium text-gray-700 mb-2">
            Език на интерфейса
          </label>
          <select
            id="locale"
            value={settings.locale}
            onChange={(e) => handleChange({ locale: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          >
            <option value="bg">🇧🇬 Български</option>
            <option value="en">🇬🇧 English</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Налични езици: Български, English
          </p>
        </div>

        {/* Accessibility Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900">Достъпност</h3>

          {/* Font Scale */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="fontScale" className="block text-sm font-medium text-gray-700">
                Размер на шрифта
              </label>
              <span className="text-sm font-semibold text-primary-600">
                {settings.fontScale}%
              </span>
            </div>
            <input
              type="range"
              id="fontScale"
              min="80"
              max="150"
              step="10"
              value={settings.fontScale}
              onChange={(e) => handleChange({ fontScale: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>80%</span>
              <span>100%</span>
              <span>150%</span>
            </div>
          </div>

          {/* Reduce Motion */}
          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => handleChange({ reduceMotion: e.target.checked })}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Намалени анимации</div>
              <div className="text-sm text-gray-600 mt-1">
                Изключва преходи и анимации (препоръчително при епилепсия или морска болест)
              </div>
            </div>
          </label>

          {/* High Contrast (future feature) */}
          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed">
            <input
              type="checkbox"
              disabled
              className="mt-1 h-5 w-5 rounded border-gray-300"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Висок контраст</div>
              <div className="text-sm text-gray-600 mt-1">
                Подобрена четливост (скоро)
              </div>
            </div>
          </label>
        </div>

        {/* Preview Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800" style={{ fontSize: `${settings.fontScale}%` }}>
            <strong>Пример текст:</strong> Това е как ще изглежда текста с текущите настройки. 
            Това предложение демонстрира избрания размер на шрифта.
          </p>
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

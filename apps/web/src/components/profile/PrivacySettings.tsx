"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Loader2, Check, AlertTriangle } from "lucide-react";

interface PrivacySettings {
  public_profile: boolean;
  show_role: boolean;
  show_activity: boolean;
  searchable: boolean;
  show_verified_email: boolean;
}

export function PrivacySettings({ userId }: { userId: string }) {
  const [settings, setSettings] = useState<PrivacySettings>({
    public_profile: true,
    show_role: true,
    show_activity: true,
    searchable: true,
    show_verified_email: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const headers = await getIdTokenHeader();
        const res = await fetch("/api/me/profile", { headers });
        if (res.ok) {
          const profile = await res.json();
          setSettings(profile.privacy || settings);
        }
      } catch (err) {
        console.error("Failed to fetch privacy settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [userId]);

  async function handleToggle(field: keyof PrivacySettings, value: boolean) {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    setSuccess(false);
    
    // Auto-save
    await saveSettings(newSettings);
  }

  async function saveSettings(newSettings: PrivacySettings) {
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
          privacy: newSettings
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save privacy settings:", err);
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
        <h2 className="text-xl font-semibold text-gray-900">Поверителност</h2>
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Запазено
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Public Profile Section */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Видимост на профила</h3>

          {/* Public Profile Toggle */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              id="public_profile"
              type="checkbox"
              checked={settings.public_profile}
              onChange={(e) => handleToggle("public_profile", e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <div className="flex-1">
              <label htmlFor="public_profile" className="font-medium text-gray-900 cursor-pointer">Покажи публичен профил</label>
              <div className="text-sm text-gray-600 mt-1">
                Другите потребители могат да виждат твоя профил на /u/:id
              </div>
            </div>
          </div>

          {/* Show Role Toggle */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              id="show_role"
              type="checkbox"
              checked={settings.show_role}
              onChange={(e) => handleToggle("show_role", e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <div className="flex-1">
              <label htmlFor="show_role" className="font-medium text-gray-900 cursor-pointer">Покажи ролята ми публично</label>
              <div className="text-sm text-gray-600 mt-1">
                Показва badge (citizen, moderator, admin)
              </div>
            </div>
          </div>

          {/* Show Activity Toggle */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              id="show_activity"
              type="checkbox"
              checked={settings.show_activity}
              onChange={(e) => handleToggle("show_activity", e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <div className="flex-1">
              <label htmlFor="show_activity" className="font-medium text-gray-900 cursor-pointer">Покажи моята активност</label>
              <div className="text-sm text-gray-600 mt-1">
                Сигнали, идеи, събития, коментари
              </div>
            </div>
          </div>

          {/* Searchable Toggle */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              id="searchable"
              type="checkbox"
              checked={!settings.searchable}
              onChange={(e) => handleToggle("searchable", !e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <div className="flex-1">
              <label htmlFor="searchable" className="font-medium text-gray-900 cursor-pointer">Скрий профила от търсене</label>
              <div className="text-sm text-gray-600 mt-1">
                Не показвай в резултатите от търсене
              </div>
            </div>
          </div>
        </div>

        {/* Verified Data Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900">Потвърдени данни</h3>

          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              id="show_verified_email"
              type="checkbox"
              checked={settings.show_verified_email}
              onChange={(e) => handleToggle("show_verified_email", e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <div className="flex-1">
              <label htmlFor="show_verified_email" className="font-medium text-gray-900 cursor-pointer">Покажи &quot;✓ Потвърден имейл&quot;</label>
              <div className="text-sm text-gray-600 mt-1">
                Показва badge за потвърден email адрес
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">Важно за поверителността</p>
            <p className="mt-1">
              Имейл адресът и телефонният номер никога не се показват публично, 
              независимо от настройките.
            </p>
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

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Loader2, Check } from "lucide-react";

interface ChannelPrefs {
  inapp: boolean;
  email: boolean;
  push: boolean;
}

interface AllChannelPrefs {
  system: ChannelPrefs;
  signals: ChannelPrefs;
  ideas: ChannelPrefs;
  events: ChannelPrefs;
}

export function ChannelSettings({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<AllChannelPrefs>({
    system: { inapp: true, email: true, push: false },
    signals: { inapp: true, email: false, push: true },
    ideas: { inapp: true, email: false, push: false },
    events: { inapp: true, email: true, push: true }
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
      const res = await fetch("/api/me/notification-prefs", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.channels) {
          setPrefs(data.channels);
        }
      }
    } catch (error) {
      console.error("Failed to fetch channel preferences:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(category: keyof AllChannelPrefs, channel: keyof ChannelPrefs, value: boolean) {
    const newPrefs = {
      ...prefs,
      [category]: { ...prefs[category], [channel]: value }
    };
    setPrefs(newPrefs);
    setSuccess(false);

    // Auto-save
    await savePreferences(newPrefs);
  }

  async function savePreferences(newPrefs: AllChannelPrefs) {
    setSaving(true);

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/notification-prefs", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ channels: newPrefs })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save channel preferences:", error);
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

  const categories = [
    {
      key: "system" as const,
      icon: "⚙️",
      title: "Система",
      description: "Нов вход, промяна на роля, критични съобщения"
    },
    {
      key: "signals" as const,
      icon: "🚩",
      title: "Сигнали",
      description: "Нови сигнали в района, промяна на статус"
    },
    {
      key: "ideas" as const,
      icon: "💡",
      title: "Идеи",
      description: "Нови идеи, коментари, гласувания"
    },
    {
      key: "events" as const,
      icon: "📅",
      title: "События",
      description: "Нови събития, напомняния, RSVP промени"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Канали за известия</h2>
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Запазено
          </div>
        )}
      </div>

      <p className="text-gray-600 mb-6">
        Избери как искаш да получаваш различни видове известия
      </p>

      {categories.map((category) => (
        <Card key={category.key} className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-3xl">{category.icon}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            {/* In-app */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">In-app</span>
              <input
                type="checkbox"
                checked={prefs[category.key].inapp}
                onChange={(e) => handleToggle(category.key, "inapp", e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                disabled={category.key === "system"} // System in-app cannot be disabled
              />
            </label>

            {/* Email */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                type="checkbox"
                checked={prefs[category.key].email}
                onChange={(e) => handleToggle(category.key, "email", e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
              />
            </label>

            {/* Push */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">Push</span>
              <input
                type="checkbox"
                checked={prefs[category.key].push}
                onChange={(e) => handleToggle(category.key, "push", e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
              />
            </label>
          </div>
        </Card>
      ))}

      {saving && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Запазване...
        </div>
      )}
    </div>
  );
}

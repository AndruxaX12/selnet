"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Loader2, Check, Info } from "lucide-react";

interface DigestPrefs {
  daily: string | null;
  weekly: { day: number; time: string } | null;
  monthly: { day: number; time: string } | null;
}

export function DigestSettings({ userId }: { userId: string }) {
  const [digest, setDigest] = useState<DigestPrefs>({
    daily: null,
    weekly: null,
    monthly: null
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
      const res = await fetch("/api/me/notification-prefs", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.digest) {
          setDigest(data.digest);
        }
      }
    } catch (error) {
      console.error("Failed to fetch digest settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleChange(updates: Partial<DigestPrefs>) {
    const newDigest = { ...digest, ...updates };
    setDigest(newDigest);
    setSuccess(false);

    await saveSettings(newDigest);
  }

  async function saveSettings(newDigest: DigestPrefs) {
    setSaving(true);

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/notification-prefs", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ digest: newDigest })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save digest settings:", error);
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

  const weekdays = [
    { value: 1, label: "Понеделник" },
    { value: 2, label: "Вторник" },
    { value: 3, label: "Сряда" },
    { value: 4, label: "Четвъртък" },
    { value: 5, label: "Петък" },
    { value: 6, label: "Събота" },
    { value: 7, label: "Неделя" }
  ];

  const monthDays = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}-во` }));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Графици (Digest)</h2>
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Запазено
          </div>
        )}
      </div>

      <p className="text-gray-600 mb-6">
        Получавай обобщение на важните събития по електронна поща
      </p>

      <div className="space-y-6">
        {/* Daily Digest */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={digest.daily !== null}
              onChange={(e) => {
                if (e.target.checked) {
                  handleChange({ daily: "09:00" });
                } else {
                  handleChange({ daily: null });
                }
              }}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <span className="font-medium text-gray-900">Дневен обзор</span>
          </label>

          {digest.daily !== null && (
            <div className="ml-8">
              <label className="block text-sm text-gray-700 mb-2">
                Всеки ден в:
              </label>
              <input
                type="time"
                value={digest.daily}
                onChange={(e) => handleChange({ daily: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Weekly Digest */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={digest.weekly !== null}
              onChange={(e) => {
                if (e.target.checked) {
                  handleChange({ weekly: { day: 1, time: "09:00" } });
                } else {
                  handleChange({ weekly: null });
                }
              }}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <span className="font-medium text-gray-900">Седмичен обзор</span>
          </label>

          {digest.weekly !== null && (
            <div className="ml-8 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Ден:
                </label>
                <select
                  value={digest.weekly.day}
                  onChange={(e) => handleChange({ weekly: { ...digest.weekly!, day: parseInt(e.target.value) } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                >
                  {weekdays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Час:
                </label>
                <input
                  type="time"
                  value={digest.weekly.time}
                  onChange={(e) => handleChange({ weekly: { ...digest.weekly!, time: e.target.value } })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Monthly Digest */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={digest.monthly !== null}
              onChange={(e) => {
                if (e.target.checked) {
                  handleChange({ monthly: { day: 1, time: "09:00" } });
                } else {
                  handleChange({ monthly: null });
                }
              }}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <span className="font-medium text-gray-900">Месечен обзор</span>
          </label>

          {digest.monthly !== null && (
            <div className="ml-8 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Ден от месеца:
                </label>
                <select
                  value={digest.monthly.day}
                  onChange={(e) => handleChange({ monthly: { ...digest.monthly!, day: parseInt(e.target.value) } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                >
                  {monthDays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Час:
                </label>
                <input
                  type="time"
                  value={digest.monthly.time}
                  onChange={(e) => handleChange({ monthly: { ...digest.monthly!, time: e.target.value } })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Информация</p>
            <p className="mt-1">
              Digest се изпраща само ако има нови събития от последното изпращане. 
              Всички времена са в часова зона Europe/Sofia.
            </p>
          </div>
        </div>

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

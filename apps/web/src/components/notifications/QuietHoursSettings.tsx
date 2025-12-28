"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Loader2, Check, AlertTriangle } from "lucide-react";

interface QuietHours {
  enabled: boolean;
  from: string;
  to: string;
}

export function QuietHoursSettings({ userId }: { userId: string }) {
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    from: "22:00",
    to: "07:00"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  async function fetchSettings() {
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/notification-prefs", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.quiet_hours) {
          setQuietHours(data.quiet_hours);
        }
      }
    } catch (error) {
      console.error("Failed to fetch quiet hours settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleChange(updates: Partial<QuietHours>) {
    const newSettings = { ...quietHours, ...updates };
    setQuietHours(newSettings);
    setSuccess(false);

    await saveSettings(newSettings);
  }

  async function saveSettings(newSettings: QuietHours) {
    setSaving(true);

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/notification-prefs", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ quiet_hours: newSettings })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save quiet hours settings:", error);
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
        <h2 className="text-xl font-semibold text-gray-900">Тихи часове</h2>
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Запазено
          </div>
        )}
      </div>

      <p className="text-gray-600 mb-6">
        Определи период, в който няма да получаваш email и push известия
      </p>

      <div className="space-y-6">
        {/* Enable Toggle */}
        <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <input
            type="checkbox"
            checked={quietHours.enabled}
            onChange={(e) => handleChange({ enabled: e.target.checked })}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Активирай тихи часове</div>
            <div className="text-sm text-gray-600 mt-1">
              Няма да получаваш email и push известия в избрания период
            </div>
          </div>
        </label>

        {/* Time Range */}
        {quietHours.enabled && (
          <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-2">
                  От:
                </label>
                <input
                  type="time"
                  id="from"
                  value={quietHours.from}
                  onChange={(e) => handleChange({ from: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
                  До:
                </label>
                <input
                  type="time"
                  id="to"
                  value={quietHours.to}
                  onChange={(e) => handleChange({ to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Активен период:</strong> Всеки ден от {quietHours.from} до {quietHours.to}
              </p>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">Важно</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>In-app известия се показват винаги (дори в тихи часове)</li>
              <li>Критични системни известия могат да заобиколят тихите часове (само от администратор)</li>
              <li>Email и Push известия ще бъдат изпратени след края на тихите часове</li>
            </ul>
          </div>
        </div>

        {/* Info about timezone */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            ℹ️ Всички времена са в часова зона Europe/Sofia. Можеш да промениш часовата зона от 
            {" "}
            <a href={`${base}/me?tab=settings`} className="text-primary-600 hover:underline font-medium">
              Настройки → Предпочитания
            </a>
          </p>
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

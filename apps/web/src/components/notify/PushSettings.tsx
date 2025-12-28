"use client";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { registerPush } from "@/lib/messaging";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";

const CHANNELS = ["signals", "ideas", "events", "system"] as const;

type Channel = typeof CHANNELS[number];

type NotifyDoc = {
  enabled?: boolean;
  muted?: Channel[];
};

export default function PushSettings() {
  const { user } = useAuth();
  const db = useMemo(() => getFirestore(app), []);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState<Channel[]>([]);
  const { show } = useToast();

  useEffect(() => {
    if (!user) {
      setEnabled(false);
      setMuted([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) return;
        if (cancelled) return;
        const data = snap.data() as { notify?: NotifyDoc };
        setEnabled(Boolean(data?.notify?.enabled));
        setMuted((data?.notify?.muted as Channel[]) ?? []);
      } catch (error) {
        console.warn("PushSettings: failed to load preferences", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, user]);

  async function toggleEnabled() {
    if (!user) {
      show({ title: "Влез в профила", desc: "Нотфикациите са налични само за потребители", type: "error" });
      return;
    }

    if (!enabled) {
      setLoading(true);
      const token = await registerPush();
      setLoading(false);
      if (!token) {
        show({ title: "Разреши известия", desc: "Разрешете push известията в браузъра", type: "error" });
        return;
      }
    }

    await save({ enabled: !enabled, muted });
    setEnabled((prev) => !prev);
  }

  function toggleChannel(channel: Channel) {
    setMuted((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]));
  }

  async function save(state?: { enabled: boolean; muted: Channel[] }) {
    if (!user) return;
    const next = state ?? { enabled, muted };
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { notify: { enabled: next.enabled, muted: next.muted }, updatedAt: Date.now() },
        { merge: true }
      );
      show({ title: "Запазено" });
    } catch (error) {
      console.error("PushSettings: save failed", error);
      show({ title: "Грешка", desc: "Неуспешно запазване на настройките", type: "error" });
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Push известия</h2>
        <p className="text-sm text-gray-600">Управлявайте уведомленията от SelNet по канали.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-medium text-gray-900">Състояние</div>
          <div className="text-sm text-gray-600">{enabled ? "Активни" : "Неактивни"}</div>
        </div>
        <Button size="sm" variant={enabled ? "secondary" : "primary"} disabled={loading} onClick={toggleEnabled}>
          {loading ? "Моля, изчакайте" : enabled ? "Изключи" : "Включи"}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="font-medium text-gray-900">Заглушаване по канали</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHANNELS.map((channel) => {
            const checked = muted.includes(channel);
            return (
              <label
                key={channel}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:border-gray-300"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={checked}
                  onChange={() => toggleChannel(channel)}
                />
                <span className="text-sm text-gray-700">{label(channel)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Разрешението за известия се управлява през настройките на браузъра. Ако блокирате известията, моля разрешете ги
        отново.
      </div>

      <div>
        <Button size="sm" onClick={() => save()}>
          Запази
        </Button>
      </div>
    </div>
  );
}

function label(channel: Channel) {
  switch (channel) {
    case "signals":
      return "Сигнали";
    case "ideas":
      return "Идеи";
    case "events":
      return "Събития";
    case "system":
      return "Системни";
    default:
      return channel;
  }
}

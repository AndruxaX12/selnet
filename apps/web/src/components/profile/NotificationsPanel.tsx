"use client";

import { useState } from "react";
import { Inbox, Settings, BarChart3, Moon } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ChannelSettings } from "@/components/notifications/ChannelSettings";
import { DigestSettings } from "@/components/notifications/DigestSettings";
import { QuietHoursSettings } from "@/components/notifications/QuietHoursSettings";

type NotifSubTab = "center" | "channels" | "digest" | "quiet";

export function NotificationsPanel({ userId }: { userId: string }) {
  const [activeSubTab, setActiveSubTab] = useState<NotifSubTab>("center");

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveSubTab("center")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all flex items-center gap-2 ${
            activeSubTab === "center"
              ? "bg-primary-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Inbox className="h-4 w-4" />
          Център
        </button>
        <button
          onClick={() => setActiveSubTab("channels")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all flex items-center gap-2 ${
            activeSubTab === "channels"
              ? "bg-primary-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Settings className="h-4 w-4" />
          Канали
        </button>
        <button
          onClick={() => setActiveSubTab("digest")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all flex items-center gap-2 ${
            activeSubTab === "digest"
              ? "bg-primary-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Digest
        </button>
        <button
          onClick={() => setActiveSubTab("quiet")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all flex items-center gap-2 ${
            activeSubTab === "quiet"
              ? "bg-primary-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Moon className="h-4 w-4" />
          Тихи часове
        </button>
      </div>

      {/* Content */}
      {activeSubTab === "center" && <NotificationCenter userId={userId} />}
      {activeSubTab === "channels" && <ChannelSettings userId={userId} />}
      {activeSubTab === "digest" && <DigestSettings userId={userId} />}
      {activeSubTab === "quiet" && <QuietHoursSettings userId={userId} />}
    </div>
  );
}

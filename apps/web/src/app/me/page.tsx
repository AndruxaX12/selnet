"use client";

import { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card } from "@/components/ui/card";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { SettingsPanel } from "@/components/profile/SettingsPanel";
import { NotificationsPanel } from "@/components/profile/NotificationsPanel";
import { DataPanel } from "@/components/profile/DataPanel";
import { BarChart3, Settings, Bell, Shield, Database } from "lucide-react";


type TabType = "overview" | "settings" | "notifications" | "security" | "data";

export default function MePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    const tab = searchParams?.get("tab") as TabType;
    if (tab && ["overview", "settings", "notifications", "security", "data"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-600">Моля, влезте в профила си</p>
        </Card>
      </div>
    );
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    window.history.pushState({}, "", `${base}/me?tab=${tab}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-600">
        <a href={base} className="hover:text-primary-600">Начало</a>
        <span className="mx-2">›</span>
        <span className="text-gray-900">Моят профил</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Моят профил</h1>
        <p className="text-gray-600 mt-2">
          Управление на личните данни и настройки
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => handleTabChange("overview")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "overview"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              Общ преглед
            </button>
            <button
              onClick={() => handleTabChange("settings")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "settings"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Settings className="h-5 w-5" />
              Настройки
            </button>
            <button
              onClick={() => handleTabChange("notifications")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "notifications"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Bell className="h-5 w-5" />
              Известия
            </button>
            <button
              onClick={() => handleTabChange("security")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "security"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Shield className="h-5 w-5" />
              Сигурност
            </button>
            <button
              onClick={() => handleTabChange("data")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "data"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Database className="h-5 w-5" />
              Данни
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === "overview" && <ProfileOverview userId={user.uid} />}
        {activeTab === "settings" && <SettingsPanel userId={user.uid} />}
        {activeTab === "notifications" && <NotificationsPanel userId={user.uid} />}
        {activeTab === "security" && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold">Сигурност</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Управление на 2FA, SSO и активни сесии
            </p>
            <a 
              href={`${base}/settings/security`}
              className="inline-flex items-center gap-2 text-primary-600 hover:underline font-medium"
            >
              Отваряне на настройки за сигурност →
            </a>
          </Card>
        )}
        {activeTab === "data" && <DataPanel userId={user.uid} />}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Settings, MapPin, Bell, Lock, Shield, Trash2, Globe } from "lucide-react";
import { ROLES } from "@/lib/rbac/roles";
import GeneralSettings from "./sections/GeneralSettings";
import LocationSettings from "./sections/LocationSettings";
import NotificationSettings from "./sections/NotificationSettings";
import SecuritySettings from "./sections/SecuritySettings";
import AdminSettings from "./sections/AdminSettings";

type TabType = "general" | "location" | "notifications" | "security" | "admin";

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Зареждане...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "general" as TabType,
      label: "Общи",
      icon: Settings,
      description: "Основни настройки",
    },
    {
      id: "location" as TabType,
      label: "Локация",
      icon: MapPin,
      description: "Населено място и адрес",
    },
    {
      id: "notifications" as TabType,
      label: "Известия",
      icon: Bell,
      description: "Push известия и alerts",
    },
    {
      id: "security" as TabType,
      label: "Сигурност",
      icon: Lock,
      description: "Парола и сигурност",
    },
  ];

  // Add admin tab for ADMIN users
  if (user?.role === ROLES.ADMIN || user?.role === ROLES.OPERATOR) {
    tabs.push({
      id: "admin" as TabType,
      label: "Администрация",
      icon: Shield,
      description: "Админ панел и настройки",
    });
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
          <p className="text-gray-600 mt-2">Управлявайте вашите предпочитания</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                      <div className="flex-1">
                        <div className="text-sm">{tab.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{tab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Бързи действия</h3>
              <div className="space-y-2">
                <a
                  href="/profile"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  → Виж профил
                </a>
                <a
                  href="/me"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  → Моите сигнали
                </a>
                {(user?.role === ROLES.ADMIN || user?.role === ROLES.OPERATOR) && (
                  <a
                    href="/operator"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    → Админ панел
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {activeTab === "general" && <GeneralSettings user={user} />}
              {activeTab === "location" && <LocationSettings user={user} />}
              {activeTab === "notifications" && <NotificationSettings user={user} />}
              {activeTab === "security" && <SecuritySettings user={user} />}
              {activeTab === "admin" && <AdminSettings user={user} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


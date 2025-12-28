"use client";

import { useState } from "react";
import { User, Lock, Settings as SettingsIcon, Globe } from "lucide-react";
import { PersonalDataForm } from "./PersonalDataForm";
import { PrivacySettings } from "./PrivacySettings";
import { PreferencesForm } from "./PreferencesForm";
import { AccessibilitySettings } from "./AccessibilitySettings";

type SettingsSubTab = "personal" | "privacy" | "preferences" | "accessibility";

export function SettingsPanel({ userId }: { userId: string }) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>("personal");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Side Navigation */}
      <div className="lg:col-span-1">
        <nav className="space-y-1 sticky top-4">
          <button
            onClick={() => setActiveSubTab("personal")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
              activeSubTab === "personal"
                ? "bg-primary-600 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="font-medium">Лични данни</span>
          </button>
          <button
            onClick={() => setActiveSubTab("privacy")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
              activeSubTab === "privacy"
                ? "bg-primary-600 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Lock className="h-5 w-5" />
            <span className="font-medium">Поверителност</span>
          </button>
          <button
            onClick={() => setActiveSubTab("preferences")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
              activeSubTab === "preferences"
                ? "bg-primary-600 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
            <span className="font-medium">Предпочитания</span>
          </button>
          <button
            onClick={() => setActiveSubTab("accessibility")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
              activeSubTab === "accessibility"
                ? "bg-primary-600 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Globe className="h-5 w-5" />
            <span className="font-medium">Език и достъпност</span>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="lg:col-span-3">
        {activeSubTab === "personal" && <PersonalDataForm userId={userId} />}
        {activeSubTab === "privacy" && <PrivacySettings userId={userId} />}
        {activeSubTab === "preferences" && <PreferencesForm userId={userId} />}
        {activeSubTab === "accessibility" && <AccessibilitySettings userId={userId} />}
      </div>
    </div>
  );
}

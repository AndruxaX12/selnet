"use client";

import { useState, useEffect } from "react";
import { Globe, Trash2 } from "lucide-react";
import { ROLES } from "@/lib/rbac/roles";

interface GeneralSettingsProps {
  user: any;
}

export default function GeneralSettings({ user }: GeneralSettingsProps) {
  const [language, setLanguage] = useState("bg");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) return;

      const response = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLanguage(data.language || "bg");
      }
    } catch (error) {
      console.error("Load settings error:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) return;

      const response = await fetch("/api/settings/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language }),
      });

      if (!response.ok) throw new Error("Failed to save");

      alert("Настройките са запазени!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Грешка при запазване");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) {
        alert("Не сте влезли в системата");
        return;
      }

      const response = await fetch("/api/profile/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete");
      }

      alert("Акаунтът е изтрит успешно");
      localStorage.clear();
      window.location.href = "/";
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error.message || "Грешка при изтриване");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Общи настройки</h2>

      {/* Language */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Globe className="w-4 h-4 inline-block mr-2" />
          Език на интерфейса
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="bg">Български</option>
          <option value="en">English</option>
        </select>
        <p className="mt-2 text-sm text-gray-500">
          Изберете език за интерфейса на платформата
        </p>
      </div>

      {/* Save Button */}
      <div className="mb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium"
        >
          {saving ? "Запазване..." : "Запази промените"}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Delete Account - Only for USER */}
      {user?.role === ROLES.USER && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Опасна зона</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-2">
                  Изтриване на акаунт
                </h4>
                <p className="text-sm text-red-700 mb-4">
                  Това действие е необратимо. Вашият акаунт, профил и всички данни ще
                  бъдат изтрити завинаги.
                </p>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                    >
                      Потвърди изтриването
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
                    >
                      Откажи
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-white border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm"
                  >
                    Изтрий акаунта ми
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info for ADMIN/MODERATOR */}
      {(user?.role === ROLES.ADMIN || user?.role === ROLES.ADMINISTRATOR) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-800">
            <strong>Забележка:</strong> Администратори и модератори не могат да изтрият
            собствените си акаунти. Моля свържете се с друг администратор.
          </p>
        </div>
      )}
    </div>
  );
}


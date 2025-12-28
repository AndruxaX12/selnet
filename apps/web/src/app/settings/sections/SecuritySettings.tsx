"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";

interface SecuritySettingsProps {
  user: any;
}

export default function SecuritySettings({ user }: SecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (newPassword.length < 6) {
      alert("Паролата трябва да бъде поне 6 символа");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Паролите не съвпадат");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) {
        alert("Не сте влезли в системата");
        return;
      }

      const response = await fetch("/api/profile/update-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to update password");
      }

      alert("Паролата е променена успешно!");
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Change password error:", error);
      alert("Грешка при смяна на парола: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Сигурност и парола
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Управлявайте вашата парола и сигурност на акаунта
      </p>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="max-w-xl">
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-600" />
            Смяна на парола
          </h3>

          {/* Current Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текуща парола
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Нова парола <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Минимум 6 символа"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="mt-1 text-xs text-orange-600">
                Паролата трябва да бъде поне 6 символа
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Потвърди новата парола <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Повтори новата парола"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                Паролите не съвпадат
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || !newPassword || newPassword !== confirmPassword}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium"
          >
            {saving ? "Запазване..." : "Смени паролата"}
          </button>
        </div>
      </form>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Съвети за сигурност
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 ml-7">
          <li>• Използвайте уникална парола, различна от другите ви профили</li>
          <li>• Комбинирайте букви, цифри и символи</li>
          <li>• Минимална дължина: 6 символа (препоръчва се 12+)</li>
          <li>• Не споделяйте паролата си с никого</li>
        </ul>
      </div>

      {/* Two-Factor Authentication (Future) */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Двуфакторна автентикация (2FA)
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Добавете допълнителен слой на сигурност към вашия акаунт
            </p>
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
              Скоро достъпно
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


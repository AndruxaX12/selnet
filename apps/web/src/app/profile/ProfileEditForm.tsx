"use client";

import { useState } from "react";
import { UserProfile, ProfileUpdateData } from "@/types/profile";
import { ALL_LOCATIONS } from "@/lib/constants/locations";
import { Camera, X } from "lucide-react";

interface ProfileEditFormProps {
  profile: UserProfile;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfileEditForm({
  profile,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState<ProfileUpdateData>({
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    phoneNumber: profile.phoneNumber,
    city: profile.city,
    street: profile.street,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string>(profile.photoURL);
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Файлът е твърде голям. Максимален размер: 5MB");
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        alert("Моля изберете изображение");
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) {
        alert("Не сте влезли в системата");
        setSaving(false);
        return;
      }

      // Validate phone number format if provided
      if (formData.phoneNumber && formData.phoneNumber.trim() !== "") {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ""))) {
          alert("Невалиден телефонен номер. Използвайте формат: +359888123456 (без интервали)");
          setSaving(false);
          return;
        }
      }

      // If photo file is selected, upload it first
      let photoURL = formData.photoURL;
      if (photoFile) {
        // Convert to base64 for simple storage
        // In production, use proper image upload service
        const reader = new FileReader();
        photoURL = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });
      }

      // Prepare data for submission
      const submitData = {
        ...formData,
        photoURL,
        // Remove spaces from phone number
        phoneNumber: formData.phoneNumber ? formData.phoneNumber.replace(/\s/g, "") : "",
      };

      console.log("📤 Sending profile update:", { ...submitData, photoURL: photoURL ? 'base64...' : null });
      
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Server error:", errorData);
        throw new Error(errorData.details || errorData.error || "Failed to update profile");
      }

      // Update localStorage user data to refresh Header
      const userDataString = localStorage.getItem("user");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        userData.displayName = submitData.displayName;
        userData.phoneNumber = submitData.phoneNumber || null;
        if (photoURL) {
          userData.photoURL = photoURL;
        }
        if (submitData.city) {
          userData.city = submitData.city;
        }
        if (submitData.street) {
          userData.street = submitData.street;
        }
        
        console.log("💾 Updating localStorage user:", userData);
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Trigger storage event to update Header
        window.dispatchEvent(new Event("storage"));
        
        // Also dispatch custom event for immediate Header update
        window.dispatchEvent(new CustomEvent("userUpdated", { detail: userData }));
      }

      alert("Профилът е актуализиран успешно!");
      onSave();
    } catch (error: any) {
      console.error("Save error:", error);
      alert("Грешка при запазване: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Редактиране на профил</h1>
            <p className="text-gray-600 mt-2">Актуализирайте вашата информация</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Photo Upload */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Профилна снимка
              </label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {previewURL ? (
                    <img
                      src={previewURL}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  )}
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    JPG, PNG или GIF. Максимален размер 5MB.
                  </p>
                  {photoFile && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Избрана: {photoFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Име <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Вашето име"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+359888123456"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Формат: +359888123456 (без интервали). Оставете празно ако няма телефон.
                </p>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Населено място
                </label>
                <select
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Избери населено място</option>
                  {ALL_LOCATIONS.map((location) => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Street */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес / Улица
                </label>
                <input
                  type="text"
                  value={formData.street || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder='Например: ул. "Христо Ботев" 15'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Използва се за бъдещи локални известия
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Откажи
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {saving ? "Запазване..." : "Запази промените"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


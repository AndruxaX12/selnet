"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Camera, Loader2, Check } from "lucide-react";

interface PersonalData {
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  area_id: string;
}

export function PersonalDataForm({ userId }: { userId: string }) {
  const [data, setData] = useState<PersonalData>({
    name: "",
    email: "",
    avatar_url: "",
    bio: "",
    area_id: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [userId]);

  async function fetchData() {
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/profile", { headers });
      if (res.ok) {
        const profile = await res.json();
        setData({
          name: profile.name || "",
          email: profile.email || "",
          avatar_url: profile.avatar_url || "",
          bio: profile.bio || "",
          area_id: profile.area_id || ""
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: keyof PersonalData, value: string) {
    setData(prev => ({ ...prev, [field]: value }));
    setError("");
    setSuccess(false);
  }

  function validate(): string | null {
    if (data.name.length < 2) {
      return "Името трябва да е поне 2 символа";
    }
    if (data.name.length > 100) {
      return "Името трябва да е максимум 100 символа";
    }
    if (data.bio.length > 200) {
      return "Биографията трябва да е максимум 200 символа";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: data.name,
          bio: data.bio,
          area_id: data.area_id || null
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Грешка при запазване");
      }
    } catch (err) {
      setError("Грешка при свързване със сървъра");
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

  const initials = data.name?.charAt(0).toUpperCase() || data.email?.charAt(0).toUpperCase() || "U";

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Лични данни</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Аватар
          </label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white shadow-lg">
              {initials}
            </div>
            <div>
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                onClick={() => alert("Качването на снимка ще бъде налично скоро")}
              >
                <Camera className="h-4 w-4" />
                Качи снимка
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Max 2MB • JPG, PNG, WebP
              </p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Име *
          </label>
          <input
            type="text"
            id="name"
            value={data.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            placeholder="Въведете вашето име"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {data.name.length}/100 символа
          </p>
        </div>

        {/* Email (readonly) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={data.email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email адресът не може да се променя
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Биография
          </label>
          <textarea
            id="bio"
            value={data.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none"
            placeholder="Разкажете нещо за себе си..."
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            {data.bio.length}/200 символа
          </p>
        </div>

        {/* Area (optional dropdown - to be implemented) */}
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
            Район
          </label>
          <select
            id="area"
            value={data.area_id}
            onChange={(e) => handleChange("area_id", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          >
            <option value="">Избери район...</option>
            <option value="plovdiv_center">Пловдив Център</option>
            <option value="plovdiv_north">Северен район</option>
            <option value="plovdiv_south">Южен район</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">Промените са запазени успешно!</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => fetchData()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={saving}
          >
            Отказ
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Запазване...
              </>
            ) : (
              "Запази промените"
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}

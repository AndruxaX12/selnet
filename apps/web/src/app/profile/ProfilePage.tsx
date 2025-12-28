"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Camera, Mail, Phone, MapPin, Calendar, FileText, Shield } from "lucide-react";
import Link from "next/link";
import { getIdToken } from "firebase/auth";
import { UserProfile } from "@/types/profile";
import { ROLES } from "@/lib/rbac/roles";
import ProfileEditForm from "./ProfileEditForm";
import { useAuth } from "@/components/auth/AuthProvider";

const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: "Администратор",
  [ROLES.OPERATOR]: "Оператор",
  MODERATOR: "Модератор",
  [ROLES.USER]: "Потребител",
};

const ROLE_COLORS: Record<string, string> = {
  [ROLES.ADMIN]: "bg-red-100 text-red-800",
  [ROLES.OPERATOR]: "bg-red-100 text-red-800",
  MODERATOR: "bg-blue-100 text-blue-800",
  [ROLES.USER]: "bg-gray-100 text-gray-800",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();
  const loginUrl = "/login";
  const registerUrl = "/register";

  const clearStoredAuth = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
    localStorage.removeItem("firebaseToken");
    localStorage.removeItem("idToken");
    localStorage.removeItem("token");
  };

  // If not authenticated, show a login/register prompt instead of a preloaded profile.
  const showAuthPrompt = useMemo(() => !authLoading && !user, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      clearStoredAuth();
      setProfile(null);
      setLoading(false);
      return;
    }
    loadProfile(user);
  }, [authLoading, user]);

  const loadProfile = async (firebaseUser: NonNullable<typeof user>) => {
    try {
      const token =
        (await getIdToken(firebaseUser, true)) ||
        localStorage.getItem("idToken") ||
        localStorage.getItem("firebaseToken") ||
        localStorage.getItem("token");
      if (!token) {
        clearStoredAuth();
        router.push(loginUrl);
        return;
      }

      console.log("Loading profile with token:", token.substring(0, 20) + "...");

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Profile API response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized - redirecting to login");
          clearStoredAuth();
          await signOut().catch(() => {});
          router.push(loginUrl);
          return;
        }
        throw new Error("Failed to load profile");
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Load profile error:", error);
      alert("Грешка при зареждане на профила");
    } finally {
      setLoading(false);
    }
  };

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

  if (showAuthPrompt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white shadow-sm border border-gray-200 rounded-lg p-8 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Не сте влезли</h1>
          <p className="text-gray-600">
            За да видите профила си, първо влезте или се регистрирайте.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={loginUrl}
              className="px-5 py-2.5 rounded-lg border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition"
            >
              Вход
            </Link>
            <Link
              href={registerUrl}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Профилът не може да бъде зареден</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <ProfileEditForm
        profile={profile}
        onSave={() => {
          setIsEditing(false);
          loadProfile();
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Профил</h1>
          <p className="text-gray-600 mt-2">Вашата информация и настройки</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover & Avatar */}
          <div className="relative h-32 bg-gradient-to-r from-green-400 to-blue-500">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50"
                  title="Редактирай снимка"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-20 pb-8 px-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.displayName || "Няма име"}
                </h2>
                <p className="text-gray-600 mt-1">{profile.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    ROLE_COLORS[profile.role] || ROLE_COLORS[ROLES.USER]
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  {ROLE_LABELS[profile.role] || "Потребител"}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Редактирай профил
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Сигнали</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {profile.signalsCount}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Член от</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString("bg-BG", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Роля</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {ROLE_LABELS[profile.role] || "Потребител"}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact & Location Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Информация за контакт
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Имейл</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.email}
                    </p>
                  </div>
                </div>

                {profile.phoneNumber && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Телефон</p>
                      <p className="text-sm font-medium text-gray-900">
                        {profile.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}

                {profile.city && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Населено място</p>
                      <p className="text-sm font-medium text-gray-900">
                        {profile.city}
                      </p>
                    </div>
                  </div>
                )}

                {profile.street && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Адрес</p>
                      <p className="text-sm font-medium text-gray-900">
                        {profile.street}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/settings"
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Настройки</h3>
              <p className="text-sm text-gray-600">
                Управлявай настройките си
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>

          <a
            href="/me"
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Моите сигнали</h3>
              <p className="text-sm text-gray-600">Виж твоите сигнали</p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}


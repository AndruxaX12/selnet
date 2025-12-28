"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Flag, Lightbulb, Calendar, MessageCircle, Mail, Shield } from "lucide-react";
import { usePathname } from "next/navigation";

interface ProfileData {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  roles?: string[];
  bio?: string;
  createdAt?: number;
  lastLogin?: number;
}

interface StatsData {
  signals: number;
  ideas: number;
  events: number;
  comments: number;
}

export function ProfileOverview({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData>({ signals: 0, ideas: 0, events: 0, comments: 0 });
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  async function fetchProfileData() {
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/profile", { headers });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">Грешка при зареждане на профила</p>
      </Card>
    );
  }

  const initials = profile.name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-3xl font-bold text-white shadow-lg">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{profile.name || "Потребител"}</h2>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                {profile.email}
              </div>
              {profile.roles && profile.roles.length > 0 && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-600" />
                  <div className="flex flex-wrap gap-1">
                    {profile.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              // TODO: Open edit modal
              window.location.href = `${base}/me?tab=settings`;
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            📝 Редактирай профил
          </button>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <Flag className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.signals}</p>
              <p className="text-sm text-gray-600">Сигнали</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Lightbulb className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.ideas}</p>
              <p className="text-sm text-gray-600">Идеи</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.events}</p>
              <p className="text-sm text-gray-600">События</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.comments}</p>
              <p className="text-sm text-gray-600">Коментари</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Бързи действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a
            href={`${base}/signals/new`}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all group"
          >
            <Flag className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-gray-900">Подай сигнал</span>
          </a>
          <a
            href={`${base}/ideas/new`}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <Lightbulb className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-gray-900">Сподели идея</span>
          </a>
          <a
            href={`${base}/events/new`}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
          >
            <Calendar className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-gray-900">Създай събитие</span>
          </a>
        </div>
      </Card>

      {/* Activity Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Последна активност</h3>
        <div className="text-center py-12 text-gray-500">
          <p>Няма налична активност</p>
          <p className="text-sm mt-2">Започни да участваш в платформата!</p>
        </div>
      </Card>
    </div>
  );
}

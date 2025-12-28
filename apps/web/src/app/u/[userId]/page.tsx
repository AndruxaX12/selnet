"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Mail, Shield, CheckCircle, Flag, Lightbulb, Calendar } from "lucide-react";
import { useParams } from "next/navigation";

interface PublicProfile {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  verified_email?: boolean;
  area?: {
    id: string;
    name: string;
  };
  activity?: {
    signals: Array<{ id: string; title: string; status: string; createdAt: number }>;
    ideas: Array<{ id: string; title: string; votes: number; createdAt: number }>;
    events: Array<{ id: string; title: string; date: number; rsvp: string }>;
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params?.userId as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/users/${userId}`);
      
      if (res.status === 403) {
        setError("Този профил е частен");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Профилът не е намерен");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setError("Грешка при зареждане на профила");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">
            Този потребител е ограничил видимостта на профила си
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Към началото
          </a>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const initials = profile.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </button>

      {/* Profile Header */}
      <Card className="p-8 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white shadow-lg">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
            
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {profile.role && (
                <Badge variant="secondary" className="text-sm">
                  <Shield className="h-3 w-3 mr-1" />
                  {profile.role}
                </Badge>
              )}
              {profile.verified_email && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Потвърден имейл</span>
                </div>
              )}
            </div>

            {profile.area && (
              <p className="text-gray-600 flex items-center gap-2 mb-2">
                📍 {profile.area.name}
              </p>
            )}

            {profile.bio && (
              <p className="text-gray-700 mt-4">{profile.bio}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Activity Section */}
      {profile.activity && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Активност</h2>

          {/* Signals */}
          {profile.activity.signals && profile.activity.signals.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flag className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Сигнали ({profile.activity.signals.length})
                </h3>
              </div>
              <div className="space-y-3">
                {profile.activity.signals.map((signal) => (
                  <a
                    key={signal.id}
                    href={`/signals/${signal.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{signal.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Статус: {signal.status}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(signal.createdAt).toLocaleDateString("bg-BG")}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Ideas */}
          {profile.activity.ideas && profile.activity.ideas.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Идеи ({profile.activity.ideas.length})
                </h3>
              </div>
              <div className="space-y-3">
                {profile.activity.ideas.map((idea) => (
                  <a
                    key={idea.id}
                    href={`/ideas/${idea.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{idea.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          👍 {idea.votes} гласа
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(idea.createdAt).toLocaleDateString("bg-BG")}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Events */}
          {profile.activity.events && profile.activity.events.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  События ({profile.activity.events.length})
                </h3>
              </div>
              <div className="space-y-3">
                {profile.activity.events.map((event) => (
                  <a
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          RSVP: {event.rsvp}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleDateString("bg-BG")}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Empty State */}
          {(!profile.activity.signals || profile.activity.signals.length === 0) &&
           (!profile.activity.ideas || profile.activity.ideas.length === 0) &&
           (!profile.activity.events || profile.activity.events.length === 0) && (
            <Card className="p-12 text-center">
              <p className="text-gray-500">Все още няма публична активност</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

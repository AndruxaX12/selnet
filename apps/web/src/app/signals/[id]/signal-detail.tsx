"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { Require } from "@/components/auth/Require";
import { useAbilities } from "@/hooks/useAbilities";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminComments } from "@/components/signals/AdminComments";
import type { SessionUser } from "@/types/auth";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Eye, 
  MessageSquare, 
  Users, 
  ExternalLink, 
  Clock, 
  Share2, 
  Shield, 
  Bell 
} from "lucide-react";

// Dynamic import за картата (избягва SSR проблеми с Leaflet)
const SignalMap = dynamic(() => import("@/components/signals/SignalMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
      <MapPin className="w-12 h-12 text-gray-300" />
    </div>
  ),
});

// Статуси с български имена и цветове
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  novo: { label: "Нов", bgColor: "bg-red-100", textColor: "text-red-800" },
  new: { label: "Нов", bgColor: "bg-red-100", textColor: "text-red-800" },
  v_process: { label: "В процес", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
  in_progress: { label: "В процес", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
  zavarsheno: { label: "Завършен", bgColor: "bg-green-100", textColor: "text-green-800" },
  resolved: { label: "Завършен", bgColor: "bg-green-100", textColor: "text-green-800" },
  othvarlen: { label: "Отхвърлен", bgColor: "bg-gray-100", textColor: "text-gray-800" },
  rejected: { label: "Отхвърлен", bgColor: "bg-gray-100", textColor: "text-gray-800" },
};

// Категории с pointer изображения и fallback emoji
const CATEGORY_CONFIG: Record<string, { icon: string; pointer: string; label: string }> = {
  "Пожар": { icon: "🔥", pointer: "/pointers/Пожар.png", label: "Пожар" },
  "ВиК": { icon: "💧", pointer: "/pointers/ВиК.png", label: "ВиК" },
  "Ток": { icon: "⚡", pointer: "/pointers/Ток.png", label: "Ток" },
  "Пътища и тротоари": { icon: "🛣️", pointer: "/pointers/Пътища и тротоари.png", label: "Пътища и тротоари" },
  "отпадъци": { icon: "🗑️", pointer: "/pointers/отпадъци.png", label: "Отпадъци" },
  "Осветление": { icon: "💡", pointer: "/pointers/Осветление.png", label: "Осветление" },
  "Транспорт": { icon: "🚗", pointer: "/pointers/Транспорт.png", label: "Транспорт" },
  "Шум": { icon: "🔊", pointer: "/pointers/Шум.png", label: "Шум" },
  "Друго": { icon: "📌", pointer: "/pointers/Друго.png", label: "Друго" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Нисък приоритет", color: "text-gray-600" },
  normal: { label: "Нормален приоритет", color: "text-blue-600" },
  high: { label: "Висок приоритет", color: "text-orange-600" },
  urgent: { label: "Спешен", color: "text-red-600" },
};

interface SignalDetailProps {
  signal: any;
}

export function SignalDetail({ signal }: { signal: any }) {
  const router = useRouter();
  const { can } = useAbilities();
  const { user: authUser, localUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(signal.watchers?.length || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [views, setViews] = useState<number>(signal.views || 0);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const pathname = usePathname();



  // Get user from AuthProvider (Firebase Auth or localStorage fallback)
  useEffect(() => {
    // First try Firebase Auth user
    if (authUser) {
      const sessionUser: SessionUser = {
        uid: authUser.uid,
        email: authUser.email || undefined,
        displayName: authUser.displayName || undefined,
        photoURL: authUser.photoURL || undefined,
        role: undefined, // Firebase Auth doesn't have role, need to fetch
        emailVerified: authUser.emailVerified
      };
      setUser(sessionUser);
      setUserLoading(false);
      return;
    }
    
    // Fallback to localStorage user from AuthProvider
    if (localUser) {
      console.log("SignalDetail: Using localUser from AuthProvider", localUser);
      const sessionUser: SessionUser = {
        uid: localUser.uid,
        email: localUser.email || undefined,
        displayName: localUser.displayName || undefined,
        photoURL: localUser.photoURL || undefined,
        role: localUser.role?.toLowerCase() as any,
        emailVerified: true
      };
      setUser(sessionUser);
      setUserLoading(false);
      return;
    }
    
    // No user found
    setUser(null);
    setUserLoading(false);
  }, [authUser, localUser]);

  const isOwner = user?.uid === signal.author_id;
  const canEdit = isOwner || can("update:own");
  const canDelete = isOwner || can("admin:users");

  // Track view on mount (with 6-hour cooldown)
  useEffect(() => {
    // Get user data for view tracking
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        headers["X-User-Data"] = encodeURIComponent(storedUser);
      }
    }
    
    fetch(`/api/signals/${signal.id}/view`, { 
      method: "POST",
      headers
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setViews(prev => prev + 1);
        }
      })
      .catch(err => console.error("Failed to track view:", err));
  }, [signal.id]);
  
  // Check if user is already following
  useEffect(() => {
    if (user) {
      fetch(`/api/signals/${signal.id}/follow-status`)
        .then(res => res.json())
        .then(data => {
          setIsFollowing(data.following || false);
        })
        .catch(err => console.error("Failed to check follow status:", err));
    }
  }, [signal.id, user]);
  
  // Get status config with fallback
  const statusConfig = STATUS_CONFIG[signal.status] || STATUS_CONFIG.novo;
  
  // Get category config with fallback
  const categoryConfig = CATEGORY_CONFIG[signal.category] || { 
    icon: "📌", 
    pointer: "/pointers/Друго.png", 
    label: signal.category || "Друго" 
  };
  
  // Get priority config
  const priorityConfig = PRIORITY_CONFIG[signal.priority] || PRIORITY_CONFIG.normal;
  
  // Get location coordinates
  const lat = signal.location?.lat || signal.location?.latitude;
  const lng = signal.location?.lng || signal.location?.longitude;
  const hasCoordinates = lat && lng;
  
  async function handleFollow() {
    if (!user) {
      router.push(`/login?redirect=/signals/${signal.id}`);
      return;
    }
    
    try {
      const res = await fetch(`/api/signals/${signal.id}/follow`, {
        method: "POST",
      });
      
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setFollowers((prev: number) => (isFollowing ? prev - 1 : prev + 1));
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  }
  
  async function handleDelete() {
    if (!confirm("Сигурен ли си, че искаш да изтриеш този сигнал?")) return;
    
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/signals/${signal.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        router.push("/signals");
      } else {
        alert("Грешка при изтриване");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Грешка при изтриване");
    } finally {
      setIsDeleting(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <Link
            href="/signals"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Всички сигнали
          </Link>
        </div>
      </div>
      
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* ========== GEN 2 LAYOUT: Map Left + Details Right ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* LEFT SIDE: Map */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[400px] lg:h-[500px] lg:sticky lg:top-20">
              {hasCoordinates ? (
                <SignalMap
                  lat={Number(lat)}
                  lng={Number(lng)}
                  title={signal.title}
                  category={signal.category}
                  address={signal.address || signal.district}
                  height={500}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                  <MapPin className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">Няма координати</p>
                  <p className="text-sm">Местоположението не е зададено</p>
                </div>
              )}
            </div>
          </div>
          
          {/* RIGHT SIDE: Signal Details Card */}
          <div className="order-1 lg:order-2">
            <Card className="p-6 shadow-lg">
              {/* Status & Category Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Status Chip */}
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </span>
                
                {/* Category Chip with Pointer Image */}
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {categoryConfig.pointer ? (
                    <img 
                      src={categoryConfig.pointer} 
                      alt={categoryConfig.label}
                      className="w-5 h-5 object-contain"
                    />
                  ) : (
                    <span>{categoryConfig.icon}</span>
                  )}
                  {categoryConfig.label}
                </span>
                
                {/* Priority (if not normal) */}
                {signal.priority && signal.priority !== "normal" && (
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-orange-50 border border-orange-200 ${priorityConfig.color}`}>
                    {priorityConfig.label}
                  </span>
                )}
              </div>
              
              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                {signal.title}
              </h1>
              
              {/* Timeline - "публикуван преди X часа/дни" */}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <Clock className="w-4 h-4" />
                <span>Публикуван <strong className="text-gray-700">{formatRelativeTime(signal.created_at)}</strong></span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-mono text-gray-400">#{signal.id.slice(0, 8)}</span>
              </div>
              
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Описание</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {signal.description || "Няма добавено описание."}
                </p>
              </div>
              
              {/* Location Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Локация
                </h3>
                
                {signal.district && (
                  <p className="text-gray-800 font-medium mb-1">
                    {signal.district}
                  </p>
                )}
                {signal.address && signal.address !== signal.district && (
                  <p className="text-gray-600 text-sm mb-2">
                    {signal.address}
                  </p>
                )}
                
                {hasCoordinates && (
                  <>
                    <p className="text-xs text-gray-400 font-mono mb-3">
                      {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Google Maps
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        🧭 Навигация
                      </a>
                    </div>
                  </>
                )}
              </div>
              
              {/* Author Info */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                {signal.isAnonymous === true ? (
                  // Анонимен автор - САМО ако isAnonymous е изрично true
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 text-sm">
                        Анонимен потребител
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(signal.created_at)}
                      </p>
                    </div>
                  </>
                ) : (
                  // Известен автор - показва име и роля
                  <>
                    {signal.author_photo ? (
                      <img 
                        src={signal.author_photo} 
                        alt="Автор"
                        className="h-10 w-10 rounded-full object-cover border-2 border-green-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold">
                        {(signal.author_name || signal.author_email)?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {signal.author_name || signal.author_email || "Потребител"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {signal.author_role === "admin" || signal.author_role === "administrator" ? "Администратор" : 
                         signal.author_role === "coordinator" ? "Координатор" :
                         signal.author_role === "municipal" ? "Общински служител" :
                         signal.author_role ? signal.author_role.charAt(0).toUpperCase() + signal.author_role.slice(1) :
                         "Потребител"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(signal.created_at)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{views}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" /> Гледания
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{followers}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> Следят
                  </div>
                </div>
              </div>
              
              {/* Follow Button */}
              <div className="mb-6">
                <Button
                  onClick={handleFollow}
                  disabled={!user}
                  variant={isFollowing ? "secondary" : "default"}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {isFollowing ? "Прекрати следене" : "Следи"}
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Require anyOf={["USER", "OPERATOR", "ADMIN"]}>
                  <Button variant="outline" className="flex-1">
                    👍 Подкрепи
                  </Button>
                </Require>
                
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/signals/${signal.id}/edit`)}
                  >
                    ✏️ Редактирай
                  </Button>
                )}
                
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "..." : "🗑️ Изтрий"}
                  </Button>
                )}
              </div>
              
              {/* Last Update */}
              {signal.updated_at && signal.updated_at !== signal.created_at && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                  Последна актуализация: {formatRelativeTime(signal.updated_at)}
                </div>
              )}
            </Card>
          </div>
        </div>
        
        {/* Photos Gallery - Full Width Below */}
        {signal.photos && signal.photos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📷 Снимки ({signal.photos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {signal.photos.map((photo: string, index: number) => (
                <div 
                  key={index} 
                  className="aspect-square overflow-hidden rounded-lg bg-gray-100 border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <img
                    src={photo}
                    alt={`Снимка ${index + 1}`}
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Comments Section - Admin Only */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {userLoading ? (
            <div className="text-center py-4 text-gray-500">Зареждане...</div>
          ) : (
            <AdminComments
              signalId={signal.id}
              currentUser={user}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Функция за относително време (преди X часа/дни)
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (minutes < 1) return "току-що";
  if (minutes < 60) return `преди ${minutes} ${minutes === 1 ? "минута" : "минути"}`;
  if (hours < 24) return `преди ${hours} ${hours === 1 ? "час" : "часа"}`;
  if (days === 1) return "вчера";
  if (days < 7) return `преди ${days} ${days === 1 ? "ден" : "дни"}`;
  if (weeks < 4) return `преди ${weeks} ${weeks === 1 ? "седмица" : "седмици"}`;
  if (months < 12) return `преди ${months} ${months === 1 ? "месец" : "месеца"}`;
  
  return formatDate(dateString);
}

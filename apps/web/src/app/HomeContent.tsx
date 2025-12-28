"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Clock } from "lucide-react";
import { subscribeMarkerClick } from "@/components/home/map/events";
import { usePathname } from "next/navigation";

// Dynamic import на картата
const HomeMapDynamic = dynamic(() => import("@/components/home/HomeMap").catch(err => {
  console.error("[HomeContent] Failed to load HomeMap:", err);
  return { default: () => <div className="h-full w-full flex items-center justify-center text-red-500">Грешка при зареждане на картата</div> };
}), {
  ssr: false,
  loading: () => <MapSkeleton />
});

// Signal type
interface Signal {
  id: string;
  title: string;
  status: "нов" | "в процес" | "завършен";
  location: string;
  time: string;
  description: string;
  category?: string;
  imageUrl?: string;
}

export default function HomeContent() {

  const [signals, setSignals] = useState<Signal[]>([]);
  // "current" -> само нови и в процес; "all" -> само завършени
  const [filter, setFilter] = useState<"current" | "all">("current");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const signalRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Listen for marker clicks from the map - РАЗШИРЯВА И SCROLL
  useEffect(() => {
    const unsubscribe = subscribeMarkerClick((signalId: string) => {
      // Разширяване + scroll до сигнала
      setExpandedId(signalId);
      setTimeout(() => {
        const element = signalRefs.current[signalId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    });
    return () => unsubscribe();
  }, []);

  // Fetch signals from API
  useEffect(() => {
    async function fetchSignals() {
      try {
        setLoading(true);
        const res = await fetch("/api/signals?limit=10");
        if (res.ok) {
          const data = await res.json();
          const transformed = (data.items || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            status: mapStatusToBulgarian(s.status),
            location: s.district || s.location?.address || "Неизвестна локация",
            time: formatRelativeTime(s.created_at),
            description: s.description || "",
            category: s.category,
            imageUrl: s.imageUrl
          }));
          setSignals(transformed);
        } else {
          setSignals(DEMO_SIGNALS);
        }
      } catch (error) {
        console.error("Failed to fetch signals:", error);
        setSignals(DEMO_SIGNALS);
      } finally {
        setLoading(false);
      }
    }
    fetchSignals();
  }, []);

  const filteredSignals = signals.filter(signal => {
    if (filter === "current") {
      return signal.status === "нов" || signal.status === "в процес";
    }
    // filter === "all" => показваме само завършени (завършен/отхвърлен не се показва тук)
    return signal.status === "завършен";
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-120px)] md:flex-row">
      {/* Карта - 50% на mobile, flex-1 на desktop */}
      <div className="relative h-[50vh] md:h-full md:flex-1">
        <div className="relative h-full w-full overflow-hidden">
          <Suspense fallback={<MapSkeleton />}>
            <HomeMapDynamic />
          </Suspense>

          {/* Бутони за филтриране - ВИНАГИ ВИДИМИ */}
          <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-[1000] flex gap-2">
            <button
              onClick={() => setFilter("current")}
              className={`px-3 py-2 md:px-4 text-sm md:text-base rounded-lg font-medium transition-all shadow-md hover:shadow-lg tracking-tight ${
                filter === "current"
                  ? "bg-green-600 text-white border border-green-600 hover:bg-green-700"
                  : "bg-white text-green-700 border border-green-600 hover:bg-green-50"
              }`}
            >
              Текущи
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-2 md:px-4 text-sm md:text-base rounded-lg font-medium transition-all shadow-md hover:shadow-lg tracking-tight ${
                filter === "all"
                  ? "bg-green-600 text-white border border-green-600 hover:bg-green-700"
                  : "bg-white text-green-700 border border-green-600 hover:bg-green-50"
              }`}
            >
              Завършени
            </button>
          </div>
        </div>
      </div>

      {/* Сигнали - 50% на mobile, sidebar на desktop */}
      <aside className="flex-1 md:w-96 md:flex-initial border-t md:border-t-0 md:border-l border-gray-200 bg-white flex flex-col overflow-hidden">
        <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 flex-shrink-0 text-gray-900 px-4 pt-4 md:px-5 md:pt-5 tracking-tight">Сигнали</h2>

        {/* Скролируем списък със сигнали */}
        <div className="flex-1 overflow-y-auto px-4 md:px-5 md:pr-2">
          {loading ? (
            <div className="space-y-2 md:space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 md:p-4 animate-pulse">
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-md flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 md:h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 md:h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-2 md:h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <p className="text-sm md:text-base text-gray-500">Няма намерени сигнали</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {filteredSignals.map((signal) => (
                <div
                  key={signal.id}
                  ref={(el) => { signalRefs.current[signal.id] = el; }}
                >
                  <SignalCard
                    signal={signal}
                    isExpanded={expandedId === signal.id}
                    onToggle={() => toggleExpand(signal.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Бутон "Подай сигнал" */}
        <div className="mt-auto pt-3 pb-3 px-4 md:pt-4 md:pb-5 md:px-5 flex-shrink-0 bg-white border-t border-gray-100">
          <Link href="/signals/new">
            <button className="w-full px-4 py-3 md:py-2 rounded-lg bg-green-600 text-white font-medium text-base md:text-lg hover:bg-green-700 active:bg-green-800 transition-all shadow-md hover:shadow-lg tracking-tight">
              Подай сигнал
            </button>
          </Link>
        </div>
      </aside>
    </main>
  );
}

// Signal Card Component - Mobile оптимизиран
function SignalCard({ signal, isExpanded, onToggle }: { signal: Signal; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className={`border border-gray-200 rounded-lg shadow-sm hover:shadow-md active:shadow-lg cursor-pointer p-3 md:p-4 transition-all ${
        isExpanded ? "bg-white" : "bg-white"
      }`}
    >
      {/* Основно съдържание */}
      <div className={`flex ${isExpanded ? "flex-col" : "items-start space-x-2 md:space-x-3"}`}>
        {/* Image Placeholder */}
        {isExpanded ? (
          signal.imageUrl ? (
            <img
              src={signal.imageUrl}
              alt={signal.title}
              className="w-full h-32 md:h-48 object-cover rounded-md mb-2 md:mb-3"
            />
          ) : (
            <div className="w-full h-32 md:h-48 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 mb-2 md:mb-3">
              <svg className="w-12 h-12 md:w-16 md:h-16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          )
        ) : (
          signal.imageUrl ? (
            <img
              src={signal.imageUrl}
              alt={signal.title}
              className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 flex-shrink-0">
              <svg className="w-6 h-6 md:w-8 md:h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          )
        )}

        {/* Текстово съдържание */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-snug tracking-tight">{signal.title}</h3>
          <div className="flex items-center flex-wrap gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 mt-1.5">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <StatusIcon status={signal.status} />
              <span className="font-medium">{signal.status}</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="truncate text-xs md:text-sm font-normal">{signal.location}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <Clock className="inline-block h-3 w-3 md:h-4 md:w-4 text-gray-400" />
            <span className="font-light">{signal.time}</span>
          </div>
        </div>
      </div>

      {/* Скрито описание (показва се при expand) */}
      {isExpanded && (
        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
          <h4 className="font-semibold text-gray-700 text-xs md:text-sm mb-1">Описание на сигнала:</h4>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{signal.description}</p>
        </div>
      )}
    </div>
  );
}

// Status Icon Component
function StatusIcon({ status }: { status: string }) {
  const colorClass = status === "нов" ? "text-red-500" : status === "в процес" ? "text-yellow-500" : "text-green-500";
  
  return (
    <svg className={`w-4 h-4 ${colorClass}`} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function MapSkeleton() {
  return (
    <div className="h-full w-full animate-pulse bg-gray-200 flex items-center justify-center">
      <div className="text-gray-400">
        <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: number | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "току-що";
  if (minutes < 60) return `преди ${minutes} мин.`;
  if (hours < 24) return `преди ${hours} ч.`;
  if (days === 1) return "преди 1 ден";
  return `преди ${days} дни`;
}

function mapStatusToBulgarian(status: string): "нов" | "в процес" | "завършен" {
  switch (status) {
    case "novo":
    case "new":
      return "нов";
    case "v_process":
    case "in_progress":
      return "в процес";
    case "zavarsheno":
    case "resolved":
    case "completed":
      return "завършен";
    default:
      return "нов";
  }
}

const DEMO_SIGNALS: Signal[] = [
  {
    id: "1",
    title: "Опасна дупка на ул. Иван Вазов",
    status: "нов",
    location: "гр. Ботевград",
    time: "преди 34 мин.",
    description: "Дупката е много голяма и опасна, особено вечер. Намира се точно пред входа на училището."
  },
  {
    id: "2",
    title: "Неработеща улична лампа",
    status: "в процес",
    location: "с. Врачеш",
    time: "преди 2 ч.",
    description: "Една от уличните лампи, намиращи се на ул. \"Бузлуджа\" № 21 не работи от вчера."
  },
  {
    id: "3",
    title: "Образувано сметище",
    status: "в процес",
    location: "с. Трудовец",
    time: "преди 11 ч.",
    description: "В края на селото, близо до реката, се е образувало нерегламентирано сметище."
  },
  {
    id: "4",
    title: "Дърво с изсъхнали клони",
    status: "завършен",
    location: "гр. Ботевград",
    time: "преди 1 ден",
    description: "Клоните са изсъхнали и има опасност да паднат върху минаващите автомобили. Дървото е на ул. \"Гурко\"."
  },
  {
    id: "5",
    title: "Счупена пейка в парка",
    status: "нов",
    location: "гр. Ботевград",
    time: "преди 2 дни",
    description: "Пейката до фонтана е счупена и не може да се използва."
  }
];

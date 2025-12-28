"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Signal, SignalStatus } from "@/types/operator";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/operator/constants";
import { Loader2, ArrowLeft, MapPin, Calendar, User, MessageSquare, Shield, Clock, Send, FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker.svg',
  iconUrl: '/marker.svg',
  shadowUrl: null,
});

interface Comment {
  id: string;
  body: string;
  author_name: string;
  createdAt: number;
  type: "comment" | "internal_note";
  is_admin?: boolean;
}

interface HistoryItem {
  id: string;
  msg: string;
  createdAt: number;
  type: string;
  diff?: any;
}

export default function SignalDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [signal, setSignal] = useState<Signal | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newStatus, setNewStatus] = useState<SignalStatus | "">("");
  const [statusComment, setStatusComment] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSignal();
  }, [id]);

  const fetchSignal = async () => {
    try {
      const res = await fetch(`/api/admin/signals/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSignal(data.signal);
        setComments(data.comments || []);
        setHistory(data.history || []);
        setNewStatus(data.signal.status);
      }
    } catch (error) {
      console.error("Failed to fetch signal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === signal?.status) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          comment: statusComment
        })
      });
      
      if (res.ok) {
        setStatusComment("");
        fetchSignal();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!internalNote.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalNote: internalNote
        })
      });
      
      if (res.ok) {
        setInternalNote("");
        fetchSignal();
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSignal = async () => {
    if(!confirm("Сигурни ли сте, че искате да изтриете този сигнал?")) return;
    try {
        const res = await fetch(`/api/admin/signals/${id}`, { method: "DELETE" });
        if(res.ok) {
            router.push(`/${locale}/admin/signals`);
        }
    } catch(e) {
        console.error(e);
    }
  };

  const handleDeleteMedia = async (url: string) => {
    if(!confirm("Изтриване на снимка?")) return;
    const currentImages = (signal?.images || []) as any[];
    const newImages = currentImages.filter(img => img.url !== url);
    
    try {
        const res = await fetch(`/api/admin/signals/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: newImages })
        });
        if(res.ok) fetchSignal();
    } catch(e) {
        console.error(e);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary-600" /></div>;
  if (!signal) return <div className="p-8">Signal not found</div>;

  const media = (signal.images || []) as { url: string }[];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{signal.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>ID: {signal.id}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(signal.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {signal.reporter?.name || "Анонимен"}</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[signal.status]}`}>
            {STATUS_LABELS[signal.status]}
          </span>
          <button 
            onClick={handleDeleteSignal}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Изтрий сигнал"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Детайли</h2>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">{signal.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <span className="text-gray-500 block">Категория</span>
                <span className="font-medium">{signal.category_name}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Адрес</span>
                <span className="font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {signal.address}
                </span>
              </div>
            </div>

            {/* Map */}
            <div className="h-64 rounded-lg overflow-hidden border border-gray-200 z-0 relative">
               {typeof window !== 'undefined' && (
                 <MapContainer 
                   center={[signal.coordinates.lat, signal.coordinates.lng]} 
                   zoom={15} 
                   style={{ height: "100%", width: "100%" }}
                   scrollWheelZoom={false}
                 >
                   <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                   <Marker position={[signal.coordinates.lat, signal.coordinates.lng]} />
                 </MapContainer>
               )}
            </div>
          </div>

          {/* Media */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
               <ImageIcon className="h-5 w-5" /> Прикачени файлове
             </h2>
             
             {media.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 {media.map((item: { url: string }, index: number) => (
                   <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                     <img 
                       src={item.url} 
                       alt={`Прикачен файл ${index + 1}`}
                       className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <a 
                         href={item.url} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                         title="Преглед"
                       >
                         <ImageIcon className="h-4 w-4 text-gray-700" />
                       </a>
                       <button
                         onClick={() => handleDeleteMedia(item.url)}
                         className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors text-white"
                         title="Изтрий"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-gray-500 italic">
                 Няма прикачени файлове
               </div>
             )}
          </div>

          {/* Discussion (Public Comments) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Дискусия
            </h2>
            <div className="space-y-4">
              {comments.filter(c => c.type !== "internal_note").map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{comment.author_name}</span>
                      <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.body}</p>
                  </div>
                </div>
              ))}
              {comments.filter(c => c.type !== "internal_note").length === 0 && (
                <p className="text-gray-500 text-sm">Няма коментари</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Управление на статус</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as SignalStatus)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              {newStatus !== signal.status && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Коментар към промяната (задължителен)</label>
                  <textarea
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows={3}
                    placeholder="Напр: Екипът е изпратен на място..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Този коментар ще бъде изпратен на гражданина.</p>
                </div>
              )}

              <button
                onClick={handleStatusChange}
                disabled={updating || (newStatus !== signal.status && !statusComment)}
                className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {updating ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Запази промяната"}
              </button>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" /> Вътрешни бележки
            </h2>
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
              {comments.filter(c => c.type === "internal_note").map(note => (
                <div key={note.id} className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-xs text-purple-800">{note.author_name}</span>
                    <span className="text-xs text-purple-600">{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-purple-900">{note.body}</p>
                </div>
              ))}
               {comments.filter(c => c.type === "internal_note").length === 0 && (
                <p className="text-gray-400 text-sm italic">Няма вътрешни бележки</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Добави бележка..."
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
              <button
                onClick={handleAddNote}
                disabled={updating || !internalNote.trim()}
                className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" /> История
            </h2>
            <div className="space-y-4">
              {history.map(item => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="min-w-[4px] bg-gray-200 rounded-full" />
                  <div>
                    <p className="text-gray-900">{item.msg}</p>
                    <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

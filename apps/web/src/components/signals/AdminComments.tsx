"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { Shield, Trash2, Edit2, Send, X, AlertCircle } from "lucide-react";
import type { SessionUser } from "@/types/auth";

// Типове
interface AdminComment {
  id: string;
  signalId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
  authorRole: "ADMIN" | "MODERATOR";
  text: string;
  createdAt: string;
  editedAt?: string;
}

interface AdminCommentsProps {
  signalId: string;
  currentUser: SessionUser | null;
  onCommentsChange?: (change: number) => void;
}

// Role labels with icons - съответстват на реалните роли в системата
const ROLE_LABELS: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  ADMIN: { 
    label: "Администратор", 
    color: "text-purple-700", 
    bgColor: "bg-purple-100", 
    borderColor: "border-purple-300",
    icon: "👑" 
  },
  admin: { 
    label: "Администратор", 
    color: "text-purple-700", 
    bgColor: "bg-purple-100", 
    borderColor: "border-purple-300",
    icon: "👑" 
  },
  MODERATOR: { 
    label: "Модератор", 
    color: "text-blue-700", 
    bgColor: "bg-blue-100", 
    borderColor: "border-blue-300",
    icon: "🛡️" 
  },
  coordinator: { 
    label: "Координатор", 
    color: "text-blue-700", 
    bgColor: "bg-blue-100", 
    borderColor: "border-blue-300",
    icon: "🛡️" 
  },
  municipal: { 
    label: "Общински служител", 
    color: "text-green-700", 
    bgColor: "bg-green-100", 
    borderColor: "border-green-300",
    icon: "🏛️" 
  },
};

export function AdminComments({ signalId, currentUser, onCommentsChange }: AdminCommentsProps) {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Провери дали потребителят може да пише коментари
  // Роли от системата: resident, coordinator, municipal, admin, administrator
  const canWrite = currentUser && 
    ["admin", "administrator", "coordinator", "municipal"].includes(currentUser.role || "");
  
  const isAdmin = currentUser && ["admin", "administrator"].includes(currentUser.role || "");

  // Зареди коментарите
  useEffect(() => {
    fetchComments();
  }, [signalId]);

  async function fetchComments() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/signals/${signalId}/admin-comments`);
      
      if (!res.ok) {
        throw new Error("Грешка при зареждане на коментарите");
      }
      
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Error fetching admin comments:", err);
      setError("Не можахме да заредим коментарите");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newComment.trim() || !canWrite) return;
    
    setSubmitting(true);
    
    try {
      // Get user data from localStorage for authentication
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      
      if (storedUser) {
        headers["X-User-Data"] = storedUser;
      }
      
      const res = await fetch(`/api/signals/${signalId}/admin-comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: newComment.trim() }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Грешка при добавяне на коментар");
      }
      
      const data = await res.json();
      
      // Добави новия коментар в началото на списъка
      setComments((prev) => [data.comment, ...prev]);
      
      // Извикай callback за обновяване на броя коментари
      onCommentsChange?.(1);
      
      setNewComment("");
    } catch (err: any) {
      alert(err.message || "Грешка при добавяне на коментар");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(commentId: string) {
    if (!editText.trim()) return;
    
    try {
      const res = await fetch(`/api/signals/${signalId}/admin-comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText.trim() }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Грешка при редактиране");
      }
      
      // Обнови коментара в списъка
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, text: editText.trim(), editedAt: new Date().toISOString() }
            : c
        )
      );
      
      setEditingId(null);
      setEditText("");
    } catch (err: any) {
      alert(err.message || "Грешка при редактиране");
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Сигурен ли си, че искаш да изтриеш този коментар?")) return;
    
    try {
      const res = await fetch(`/api/signals/${signalId}/admin-comments/${commentId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Грешка при изтриване");
      }
      
      // Премахни коментара от списъка
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      
      // Извикай callback за обновяване на броя коментари
      onCommentsChange?.(-1);
    } catch (err: any) {
      alert(err.message || "Грешка при изтриване");
    }
  }

  function canEditComment(comment: AdminComment): boolean {
    if (!currentUser) return false;
    if (isAdmin) return true;
    return comment.authorId === currentUser.uid;
  }

  function canDeleteComment(comment: AdminComment): boolean {
    if (!currentUser) return false;
    if (isAdmin) return true;
    return comment.authorId === currentUser.uid;
  }

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    
    if (minutes < 1) return "току-що";
    if (minutes < 60) return `преди ${minutes} мин`;
    if (hours < 24) return `преди ${hours} ч`;
    if (days === 1) return "вчера";
    if (days < 7) return `преди ${days} дни`;
    
    return date.toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Shield className="w-5 h-5" />
          <span className="font-semibold">Коментари от администрация</span>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-gray-700">
        <span className="font-semibold">Коментари</span>
        <span className="text-sm text-gray-400">({comments.length})</span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Comment Form - само за ADMIN/MODERATOR */}
      {canWrite ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Emoji Buttons */}
          <div className="flex flex-wrap gap-2 pb-2">
            {["😊", "👍", "❤️", "🎉", "🔥", "💯", "👏", "🙏", "💪", "✅", "🚀", "⭐"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setNewComment(prev => prev + emoji)}
                className="text-lg hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                title="Вмъкни емоджи"
              >
                {emoji}
              </button>
            ))}
          </div>
          
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Напишете коментар като администрация... Можете да използвате емоджита 😊"
            className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            maxLength={2000}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {newComment.length}/2000 символа
            </span>
            <Button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Изпращане..." : "Публикувай"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
          <Shield className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          Само администрацията може да пише коментари по сигналите.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            Все още няма коментари от администрацията.
          </p>
        ) : (
          comments.map((comment) => {
            const roleConfig = ROLE_LABELS[comment.authorRole] || ROLE_LABELS.MODERATOR;
            const isEditing = editingId === comment.id;
            
            return (
              <div
                key={comment.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Avatar */}
                    {comment.authorPhoto ? (
                      <img 
                        src={comment.authorPhoto} 
                        alt={comment.authorName}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${roleConfig.bgColor} ${roleConfig.color}`}>
                        {comment.authorName[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    
                    {/* Author Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {comment.authorName}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${roleConfig.bgColor} ${roleConfig.color} ${roleConfig.borderColor}`}>
                          <span>{roleConfig.icon}</span>
                          {roleConfig.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatRelativeTime(comment.createdAt)}
                        {comment.editedAt && " (редактиран)"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {(canEditComment(comment) || canDeleteComment(comment)) && !isEditing && (
                    <div className="flex items-center gap-1">
                      {canEditComment(comment) && (
                        <button
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditText(comment.text);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Редактирай"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Изтрий"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Comment Body */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      rows={3}
                      maxLength={2000}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditText("");
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Отказ
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEdit(comment.id)}
                        disabled={!editText.trim()}
                      >
                        Запази
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {comment.text}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

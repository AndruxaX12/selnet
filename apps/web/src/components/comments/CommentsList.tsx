"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/Badge";
import { Require } from "@/components/auth/Require";
import type { SessionUser } from "@/types/auth";

interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at?: string;
  replies?: Comment[];
}

interface CommentsListProps {
  resourceType: "signal" | "idea" | "event";
  resourceId: string;
  currentUser: SessionUser | null;
  onCommentsChange?: (change: number) => void;
}

export function CommentsList({ resourceType, resourceId, currentUser, onCommentsChange }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  
  useEffect(() => {
    loadComments();
  }, [resourceType, resourceId]);
  
  async function loadComments() {
    try {
      const res = await fetch(`/api/${resourceType}s/${resourceId}/comments`);
      
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Load comments error:", err);
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleSubmit(parentId?: string) {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`/api/${resourceType}s/${resourceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          parent_id: parentId || null,
        }),
      });
      
      if (res.ok) {
        setNewComment("");
        setReplyTo(null);
        
        // Извикай callback за обновяване на броя коментари
        onCommentsChange?.(1);
        
        await loadComments();
      } else {
        const data = await res.json();
        alert(data.error || "Грешка при публикуване на коментар");
      }
    } catch (err) {
      console.error("Submit comment error:", err);
      alert("Грешка при публикуване на коментар");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  async function handleDelete(commentId: string) {
    if (!confirm("Сигурен ли си, че искаш да изтриеш този коментар?")) return;
    
    try {
      const res = await fetch(`/api/${resourceType}s/${resourceId}/comments/${commentId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        // Извикай callback за обновяване на броя коментари
        onCommentsChange?.(-1);
        
        await loadComments();
      }
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  }
  
  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Зареждане на коментари...</p>
      </Card>
    );
  }
  
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">
        Коментари ({comments.length})
      </h2>
      
      {/* New comment form */}
      <Require anyOf={["citizen", "moderator", "operator", "ombudsman", "admin"]}>
        <Card className="mb-6 p-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Напиши коментар..."
            rows={3}
            className="mb-3"
          />
          
          <div className="flex justify-end gap-2">
            {replyTo && (
              <Button
                variant="outline"
                onClick={() => {
                  setReplyTo(null);
                  setNewComment("");
                }}
              >
                Отказ
              </Button>
            )}
            
            <Button
              onClick={() => handleSubmit(replyTo || undefined)}
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? "Публикуване..." : "Публикувай"}
            </Button>
          </div>
        </Card>
      </Require>
      
      {/* Comments list */}
      {comments.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>Все още няма коментари</p>
          <p className="mt-2 text-sm">Бъди първият, който коментира</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={(id) => {
                setReplyTo(id);
                setNewComment(`@${comment.author_name} `);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  currentUser: SessionUser | null;
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}

function CommentItem({ comment, currentUser, onReply, onDelete, depth = 0 }: CommentItemProps) {
  const isOwner = currentUser?.uid === comment.author_id;
  const canDelete = isOwner;
  
  return (
    <Card className={`p-4 ${depth > 0 ? "ml-8 border-l-2" : ""}`}>
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
            {comment.author_name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{comment.author_name}</div>
            <div className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </div>
          </div>
        </div>
        
        {comment.updated_at && comment.updated_at !== comment.created_at && (
          <Badge variant="secondary" className="text-xs">
            редактиран
          </Badge>
        )}
      </div>
      
      <p className="mb-3 whitespace-pre-wrap text-sm">{comment.content}</p>
      
      <div className="flex gap-2">
        <Require anyOf={["citizen", "moderator", "operator", "ombudsman", "admin"]}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment.id)}
          >
            Отговори
          </Button>
        </Require>
        
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => onDelete(comment.id)}
          >
            Изтрий
          </Button>
        )}
        
        <Require anyOf={["moderator", "admin"]}>
          <Button variant="ghost" size="sm" className="text-orange-600">
            Докладвай
          </Button>
        </Require>
      </div>
      
      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Сега";
  if (minutes < 60) return `${minutes} мин`;
  if (hours < 24) return `${hours} ч`;
  if (days === 1) return "Вчера";
  if (days < 7) return `${days} дни`;
  
  return date.toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

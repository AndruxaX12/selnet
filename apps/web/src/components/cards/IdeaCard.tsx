"use client";
import Link from "next/link";
import { MessageCircle, ThumbsUp, User } from "lucide-react";
import type { IdeaCardDTO } from "@/types/ideas";
import { StatusBadge, TagBadge } from "@/components/public/StatusBadges";
import { IDEA_CATEGORY_LABELS } from "@/types/ideas";
import { formatRelativeTime } from "@/lib/utils/date";
import { truncateText, formatCompactNumber, getInitials } from "@/lib/utils/format";

interface IdeaCardProps {
  idea: IdeaCardDTO;
  position?: number;
  onSupport?: (id: string) => void;
}

/**
 * IdeaCard - Карта за визуализация на идея
 */
export function IdeaCard({ idea, position = 0, onSupport }: IdeaCardProps) {
  const categoryLabel = IDEA_CATEGORY_LABELS[idea.category] || idea.category;
  const authorInitials = getInitials(idea.author.name);
  const displayTags = idea.tags.slice(0, 3); // Максимум 3 тага

  const handleSupport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSupport?.(idea.id);
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow group">
      <Link href={`/ideas/${idea.id}`} className="block space-y-3">
        {/* Header with Status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors flex-1">
            {idea.title}
          </h3>
          <StatusBadge status={idea.status} type="idea" />
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-600 line-clamp-3">
          {truncateText(idea.summary, 3)}
        </p>

        {/* Author & Category */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              {authorInitials}
            </div>
            <span>{idea.author.name}</span>
            {idea.author.role && (
              <span className="text-xs text-gray-500">({idea.author.role})</span>
            )}
          </div>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {categoryLabel}
          </span>
        </div>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {displayTags.map((tag) => (
              <TagBadge key={tag} label={tag} />
            ))}
            {idea.tags.length > 3 && (
              <span className="text-xs text-gray-500 self-center">
                +{idea.tags.length - 3} още
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-2 text-sm text-gray-600">
          <div className="flex items-center gap-1" title={`${idea.support_count} подкрепа`}>
            <ThumbsUp className="h-4 w-4" />
            <span className="font-semibold">{formatCompactNumber(idea.support_count)}</span>
          </div>
          <div className="flex items-center gap-1" title={`${idea.comments_count} коментара`}>
            <MessageCircle className="h-4 w-4" />
            <span>{formatCompactNumber(idea.comments_count)}</span>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          {formatRelativeTime(idea.created_at)}
          {idea.deadline && (
            <span className="ml-2">
              • Краен срок: {new Date(idea.deadline).toLocaleDateString('bg-BG')}
            </span>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSupport}
          className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          Подкрепи
        </button>
        <Link
          href={`/ideas/${idea.id}#comments`}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Коментари
        </Link>
      </div>
    </article>
  );
}

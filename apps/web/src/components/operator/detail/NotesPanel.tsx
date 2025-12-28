import { useState } from "react";
import { Note } from "@/types/operator";
import { formatRelativeTime } from "@/lib/operator/sla-utils";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { MessageSquare, Send, Eye, EyeOff, Loader2 } from "lucide-react";

interface Props {
  signalId: string;
  notes: Note[];
  onChange: () => void;
}

export function NotesPanel({ signalId, notes, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<"public" | "internal">("public");
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredNotes = notes?.filter((n) => n.type === activeTab) || [];

  const handleSubmit = async () => {
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/operator/signals/${signalId}/notes`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: activeTab,
          body: newNote,
          files: []
        })
      });

      if (res.ok) {
        setNewNote("");
        onChange();
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Бележки
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("public")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "public"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Eye className="h-4 w-4" />
          Публични ({notes?.filter((n) => n.type === "public").length || 0})
        </button>
        <button
          onClick={() => setActiveTab("internal")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "internal"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <EyeOff className="h-4 w-4" />
          Вътрешни ({notes?.filter((n) => n.type === "internal").length || 0})
        </button>
      </div>

      {/* Info Banner */}
      <div
        className={`mb-4 p-3 rounded-lg text-sm ${
          activeTab === "public"
            ? "bg-blue-50 text-blue-700"
            : "bg-yellow-50 text-yellow-700"
        }`}
      >
        {activeTab === "public"
          ? "📢 Публичните бележки са видими за подателя"
          : "🔒 Вътрешните бележки са видими само за оператори"}
      </div>

      {/* Notes List */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Няма бележки</p>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium text-gray-900">
                  {note.author_name || "Неизвестен"}
                </span>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(note.created_at)}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{note.body}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Note Form */}
      <div className="space-y-3">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={`Напиши ${
            activeTab === "public" ? "публична" : "вътрешна"
          } бележка...`}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!newNote.trim() || submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          Добави бележка
        </button>
      </div>
    </div>
  );
}

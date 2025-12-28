"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, Mail, Plus, Check, X, Clock, Calendar } from "lucide-react";
import { getIdTokenHeader } from "@/lib/get-id-token";

interface Invite {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: number;
  createdBy: {
    email: string;
    id: string;
  };
  expiresAt?: number;
  acceptedAt?: number;
  rejectedAt?: number;
  note?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  moderator: "Модератор",
  coordinator: "Координатор",
  municipal: "Общински служител",
  resident: "Жител",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-gray-100 text-gray-800 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Чакаща",
  accepted: "Приета",
  rejected: "Отказана",
  expired: "Изтекла",
};

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, []);

  async function fetchInvites() {
    try {
      setLoading(true);
      setError(null);
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/admin/invites", {
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Invites API error:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setInvites(Array.isArray(data.invites) ? data.invites : []);
    } catch (err: any) {
      console.error("Failed to fetch invites:", err);
      setError(err.message || "Грешка при зареждане на покани");
    } finally {
      setLoading(false);
    }
  }

  async function resendInvite(inviteId: string) {
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/admin/invites/${inviteId}/resend`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Resend invite error:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      await fetchInvites();
    } catch (err: any) {
      console.error("Failed to resend invite:", err);
      setError(err.message || "Грешка при повторно изпращане");
    }
  }

  async function cancelInvite(inviteId: string) {
    if (!confirm("Сигурен ли си, че искаш да откажеш тази покана?")) return;

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/admin/invites/${inviteId}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Cancel invite error:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      await fetchInvites();
    } catch (err: any) {
      console.error("Failed to cancel invite:", err);
      setError(err.message || "Грешка при отказ на поканата");
    }
  }

  const filteredInvites = invites.filter((invite) => {
    const matchesSearch =
      !search ||
      invite.email.toLowerCase().includes(search.toLowerCase()) ||
      invite.createdBy.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || invite.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: invites.filter((i) => i.status === "pending").length,
    accepted: invites.filter((i) => i.status === "accepted").length,
    rejected: invites.filter((i) => i.status === "rejected").length,
    expired: invites.filter((i) => i.status === "expired").length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Покани</h1>
          <p className="text-gray-600 mt-1">Зареждане...</p>
        </div>
        <Card className="p-8">
          <div className="h-64 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Покани</h1>
          <p className="text-gray-600 mt-1">
            Управление на покани за достъп до системата
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Нова покана
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-800 hover:text-red-900 font-medium"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-600">Чакащи</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
              <p className="text-sm text-gray-600">Приети</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              <p className="text-sm text-gray-600">Отказани</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              <p className="text-sm text-gray-600">Изтекли</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Търси по email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border bg-background pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Всички статуси</option>
                <option value="pending">Чакащи</option>
                <option value="accepted">Приети</option>
                <option value="rejected">Отказани</option>
                <option value="expired">Изтекли</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {filteredInvites.length}{" "}
            {filteredInvites.length === 1 ? "покана" : "покани"}
          </div>
        </div>
      </Card>

      {/* Invites List */}
      {filteredInvites.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени покани
            </h3>
            <p className="text-sm text-gray-600">
              {search || statusFilter !== "all"
                ? "Опитайте да промените филтрите"
                : "Все още няма изпратени покани"}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-200">
            {filteredInvites.map((invite) => (
              <div
                key={invite.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-gray-900">
                          {invite.email}
                        </p>
                        <Badge
                          className={`text-xs border ${
                            STATUS_COLORS[invite.status]
                          }`}
                        >
                          {STATUS_LABELS[invite.status]}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Роля:</span>{" "}
                          {ROLE_LABELS[invite.role] || invite.role}
                        </p>
                        <p>
                          <span className="font-medium">Създадена от:</span>{" "}
                          {invite.createdBy.email}
                        </p>
                        <p>
                          <span className="font-medium">Дата:</span>{" "}
                          {new Date(invite.createdAt).toLocaleString("bg-BG")}
                        </p>
                        {invite.expiresAt && (
                          <p>
                            <span className="font-medium">Изтича на:</span>{" "}
                            {new Date(invite.expiresAt).toLocaleString("bg-BG")}
                          </p>
                        )}
                        {invite.note && (
                          <p className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <span className="font-medium">Бележка:</span>{" "}
                            {invite.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {invite.status === "pending" && (
                      <>
                        <button
                          onClick={() => resendInvite(invite.id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Изпрати отново
                        </button>
                        <button
                          onClick={() => cancelInvite(invite.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Откажи
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create Invite Dialog */}
      {showCreateDialog && (
        <CreateInviteDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            fetchInvites();
          }}
        />
      )}
    </div>
  );
}

interface CreateInviteDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateInviteDialog({ onClose, onSuccess }: CreateInviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("resident");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ email, role, note }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Грешка при създаване на покана");
      }

      onSuccess();
    } catch (err: any) {
      console.error("Failed to create invite:", err);
      setError(err.message || "Грешка при създаване на покана");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md p-6 m-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Нова покана</h2>
          <p className="text-sm text-gray-600 mt-1">
            Изпрати покана на нов потребител
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email адрес *
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роля *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="resident">Жител</option>
              <option value="coordinator">Координатор</option>
              <option value="municipal">Общински служител</option>
              <option value="moderator">Модератор</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Бележка (опционално)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Допълнителна информация..."
              disabled={loading}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Откажи
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Изпращане..." : "Изпрати покана"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

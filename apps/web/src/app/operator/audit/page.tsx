"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, Calendar, User, FileText, Shield } from "lucide-react";
import { getIdTokenHeader } from "@/lib/get-id-token";

interface AuditLog {
  id: string;
  event: string;
  timestamp: any;
  actor: {
    id: string;
    email: string;
    roles?: string[];
  };
  target?: {
    type: string;
    id: string;
    email?: string;
  };
  details?: any;
}

const EVENT_LABELS: Record<string, string> = {
  "role.granted": "Роля предоставена",
  "role.revoked": "Роля отнета",
  "user.created": "Потребител създаден",
  "user.updated": "Потребител обновен",
  "user.deleted": "Потребител изтрит",
  "signal.created": "Сигнал създаден",
  "signal.updated": "Сигнал обновен",
  "signal.deleted": "Сигнал изтрит",
  "idea.created": "Идея създадена",
  "idea.updated": "Идея обновена",
  "event.created": "Събитие създадено",
  "event.updated": "Събитие обновено",
};

const EVENT_COLORS: Record<string, string> = {
  "role.granted": "bg-green-100 text-green-800 border-green-200",
  "role.revoked": "bg-red-100 text-red-800 border-red-200",
  "user.created": "bg-blue-100 text-blue-800 border-blue-200",
  "user.updated": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "user.deleted": "bg-red-100 text-red-800 border-red-200",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  async function fetchAuditLogs() {
    try {
      setLoading(true);
      setError(null);
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/admin/audit?limit=100", {
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Audit API error:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (err: any) {
      console.error("Failed to fetch audit logs:", err);
      setError(err.message || "Грешка при зареждане на логове");
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.event.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.email.toLowerCase().includes(search.toLowerCase()) ||
      log.target?.email?.toLowerCase().includes(search.toLowerCase());

    const matchesEvent =
      eventFilter === "all" || log.event.startsWith(eventFilter);

    return matchesSearch && matchesEvent;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">История на действията</p>
        </div>
        <Card className="p-8">
          <div className="text-center text-red-600">
            <p className="font-semibold">Грешка</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">
          История на всички действия в системата
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Търси по събитие или email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="h-10 rounded-md border bg-background pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Всички събития</option>
                <option value="role">Роли</option>
                <option value="user">Потребители</option>
                <option value="signal">Сигнали</option>
                <option value="idea">Идеи</option>
                <option value="event">Събития</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {filteredLogs.length} {filteredLogs.length === 1 ? "запис" : "записа"}
          </div>
        </div>
      </Card>

      {/* Audit Logs */}
      {filteredLogs.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени логове
            </h3>
            <p className="text-sm text-gray-600">
              {search || eventFilter !== "all"
                ? "Опитайте да промените филтрите"
                : "Все още няма записи в audit log"}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={`text-xs border ${
                          EVENT_COLORS[log.event] || "bg-gray-100 text-gray-800 border-gray-200"
                        }`}
                      >
                        {EVENT_LABELS[log.event] || log.event}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {log.timestamp?.toDate
                          ? new Date(log.timestamp.toDate()).toLocaleString("bg-BG")
                          : new Date(log.timestamp).toLocaleString("bg-BG")}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{log.actor.email}</span>
                        {log.actor.roles && log.actor.roles.length > 0 && (
                          <span className="text-gray-500">
                            ({log.actor.roles.join(", ")})
                          </span>
                        )}
                      </div>
                      {log.target && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Shield className="h-4 w-4 text-gray-400" />
                          <span>
                            {log.target.type}: {log.target.email || log.target.id}
                          </span>
                        </div>
                      )}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs">
                          <pre className="text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import SlaBadge from "@/components/admin/SlaBadge";
import { STATUS_ORDER, STATUS_LABEL, type ModerationStatus, type RecordType } from "@shared/moderation";
import { getIdTokenHeader } from "@/lib/get-id-token";

type Tab = RecordType;

interface ModerationRow {
  id: string;
  title?: string;
  settlementLabel?: string;
  createdAt?: number;
  status?: ModerationStatus;
  assignee?: string | null;
  [key: string]: unknown;
}

export default function ModBoard() {
  const [tab, setTab] = useState<Tab>("signals");
  const [status, setStatus] = useState<ModerationStatus>("new");
  const [rows, setRows] = useState<ModerationRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignUid, setAssignUid] = useState("");
  const [tagValue, setTagValue] = useState("");

  const statuses = useMemo(() => STATUS_ORDER, []);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/admin/mod/list?coll=${tab}&status=${status}`, {
        headers
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("ModBoard.fetchRows error:", errorText);
        throw new Error(errorText);
      }
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setSelected([]);
    } catch (err: any) {
      console.error("ModBoard.fetchRows", err);
      setError(`Неуспешно зареждане на записи: ${err.message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab, status]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function bulk(action: string, payload: any) {
    if (!selected.length) return;
    setError(null);
    try {
      setLoading(true);
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/admin/mod/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ coll: tab, ids: selected, action, payload })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchRows();
    } catch (err) {
      console.error("ModBoard.bulk", err);
      setError("Bulk операцията не успя.");
    } finally {
      setLoading(false);
    }
  }

  async function singleStatus(coll: Tab, id: string, to: ModerationStatus) {
    try {
      setLoading(true);
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/admin/mod/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ coll, id, to })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchRows();
    } catch (err) {
      console.error("ModBoard.singleStatus", err);
      setError("Промяната на статуса не успя.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Модериране</h1>
            <p className="text-sm text-gray-600 mt-1">
              Управлявайте входящите сигнали, идеи и събития
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              Зареждане...
            </div>
          )}
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-800 hover:text-red-900 font-medium">
              ✕
            </button>
          </div>
        )}
      </header>

      <section className="flex flex-wrap gap-2">
        {( ["signals", "ideas", "events"] as Tab[] ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              t === tab
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {t === "signals" && "🚩 "}
            {t === "ideas" && "💡 "}
            {t === "events" && "📅 "}
            {labelTab(t)}
          </button>
        ))}
      </section>

      <section className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs rounded-full px-3 py-1 border transition-colors ${
              s === status ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-neutral-600">Избрани: {selected.length}</span>
        <Button size="sm" variant="secondary" disabled={!selected.length} onClick={() => bulk("status", { to: "triaged" })}>
          Triage
        </Button>
        <Button size="sm" variant="secondary" disabled={!selected.length} onClick={() => bulk("status", { to: "in_progress" })}>
          В процес
        </Button>
        <Button size="sm" disabled={!selected.length} onClick={() => bulk("status", { to: "resolved" })}>
          Решено
        </Button>
        <Button size="sm" variant="ghost" disabled={!selected.length} onClick={() => bulk("status", { to: "rejected" })}>
          Отхвърлено
        </Button>
        <Button size="sm" variant="ghost" disabled={!selected.length} onClick={() => bulk("archive", {})}>
          Архив
        </Button>
        <div className="h-6 w-px bg-gray-200" aria-hidden />
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <span>Прехвърли към UID:</span>
          <input
            value={assignUid}
            onChange={(e) => setAssignUid(e.target.value)}
            placeholder="uid или email"
            className="rounded border px-2 py-1 text-xs"
            type="text"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!selected.length || !assignUid.trim()}
            onClick={() => {
              const uid = assignUid.trim();
              if (!uid) {
                setError("Попълнете UID за прехвърляне.");
                return;
              }
              bulk("assign", { uid });
            }}
          >
            Назначи
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <span>Етикети:</span>
          <input
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            placeholder="tag1, tag2"
            className="rounded border px-2 py-1 text-xs"
            type="text"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!selected.length || !tagValue.trim()}
            onClick={() => {
              const tags = tagValue
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              if (!tags.length) {
                setError("Добавете поне един етикет.");
                return;
              }
              bulk("tag", { tags });
            }}
          >
            Приложи етикети
          </Button>
        </div>
      </section>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={() => {
                      if (selected.length === rows.length) {
                        setSelected([]);
                      } else {
                        setSelected(rows.map(r => r.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3">Заглавие</th>
                <th className="px-4 py-3">Локация</th>
                <th className="px-4 py-3">Създаден</th>
                <th className="px-4 py-3">SLA</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                      <p className="text-sm text-gray-600">Зареждане на записи...</p>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-4xl">📭</div>
                      <div>
                        <p className="font-medium text-gray-900">Няма записи</p>
                        <p className="text-sm text-gray-600 mt-1">Няма {labelTab(tab).toLowerCase()} със статус "{STATUS_LABEL[status]}"</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={() => toggle(row.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <a 
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline" 
                        href={`/${currentLocale()}/${tab}/${row.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        {row.title || "(без заглавие)"}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{row.settlementLabel || "—"}</td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-4">
                      <SlaBadge type={tab} createdAt={row.createdAt} status={row.status || "new"} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                        {STATUS_LABEL[row.status || "new"]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => singleStatus(tab, row.id, nextStatus(row.status || "new"))}
                        disabled={loading}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Следващ →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function labelTab(tab: Tab) {
  return {
    signals: "Сигнали",
    ideas: "Идеи",
    events: "Събития"
  }[tab];
}

function nextStatus(current: ModerationStatus): ModerationStatus {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return current;
  return STATUS_ORDER[idx + 1];
}

function formatDate(ts?: number) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("bg-BG");
  } catch {
    return "";
  }
}

function currentLocale() {
  try {
    return window.location.pathname.split("/")[1] || "bg";
  } catch {
    return "bg";
  }
}


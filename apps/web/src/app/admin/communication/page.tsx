"use client";

import { useState, useEffect } from "react";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Loader2, Send, History, CheckCircle, AlertCircle, Users } from "lucide-react";
import Link from "next/link";

interface MailLog {
  id: string;
  to: string | string[];
  subject: string;
  sentAt: string;
  status: string;
  category: string;
}

interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: string;
}

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
  
  // Compose State
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState<"all" | "admins" | "operators" | "selected">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendResult, setSendResult] = useState<{success: boolean; msg: string} | null>(null);

  const templates = [
    { name: "Изберете шаблон...", subject: "", body: "" },
    { name: "Сигнал: Приет", subject: "Вашият сигнал е приет", body: "Здравейте,\n\nВашият сигнал е приет и се обработва.\n\nПоздрави,\nЕкипът на Община Ботевград" },
    { name: "Сигнал: Решен", subject: "Вашият сигнал е решен", body: "Здравейте,\n\nВашият сигнал беше успешно решен. Благодарим ви за гражданската активност.\n\nПоздрави,\nЕкипът на Община Ботевград" },
    { name: "Важно съобщение", subject: "Важно съобщение от Община Ботевград", body: "Уважаеми граждани,\n\nИнформираме ви за следното...\n\nПоздрави,\nОбщина Ботевград" }
  ];

  const applyTemplate = (index: number) => {
    if (index > 0 && index < templates.length) {
        setSubject(templates[index].subject);
        setMessage(templates[index].body);
    }
  };

  // History State
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeTab === "history") {
      fetchLogs();
    }
    if (targetGroup === "selected" && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab, targetGroup]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/admin/communication/logs", { headers });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const headers = await getIdTokenHeader();
      // Using existing users endpoint
      const res = await fetch("/api/admin/users", { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    if (targetGroup === "selected" && selectedUsers.length === 0) {
        alert("Моля изберете поне един потребител.");
        return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/admin/communication/send", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          targetGroup,
          targetUsers: selectedUsers
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSendResult({ success: true, msg: `Успешно изпратено до ${data.count} получатели.` });
        setSubject("");
        setMessage("");
        setSelectedUsers([]);
        setTargetGroup("all");
      } else {
        setSendResult({ success: false, msg: "Грешка при изпращане." });
      }
    } catch (e) {
      console.error(e);
      setSendResult({ success: false, msg: "Грешка на сървъра." });
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (email: string) => {
    if (selectedUsers.includes(email)) {
      setSelectedUsers(selectedUsers.filter(e => e !== email));
    } else {
      setSelectedUsers([...selectedUsers, email]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Комуникация</h1>
        <div className="flex space-x-2 bg-white rounded-lg p-1 border shadow-sm">
          <button
            onClick={() => setActiveTab("compose")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "compose" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Send className="w-4 h-4 inline-block mr-2" />
            Ново съобщение
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "history" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <History className="w-4 h-4 inline-block mr-2" />
            История
          </button>
        </div>
      </div>

      {activeTab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Получатели</label>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
                    {[
                      { id: "all", label: "Всички", icon: Users },
                      { id: "admins", label: "Администратори", icon: CheckCircle },
                      { id: "operators", label: "Оператори", icon: CheckCircle },
                      { id: "selected", label: "Избрани", icon: Users },
                    ].map((type) => (
                      <div
                        key={type.id}
                        onClick={() => setTargetGroup(type.id as any)}
                        className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all ${
                          targetGroup === type.id
                            ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <type.icon className="w-5 h-5 mb-2 opacity-70" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </div>
                    ))}
                  </div>

                  {targetGroup === "selected" && (
                    <div className="mb-4 border rounded-md p-4 max-h-60 overflow-y-auto bg-gray-50">
                      {loadingUsers ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 mb-2">Изберете потребители:</p>
                          {users.map(u => (
                            <label key={u.uid} className="flex items-center space-x-2 text-sm p-1 hover:bg-gray-100 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(u.email)}
                                onChange={() => toggleUserSelection(u.email)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="flex-1">{u.email}</span>
                              <span className="text-xs text-gray-400 border px-1 rounded">{u.role}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Шаблон</label>
                  <select
                    onChange={(e) => applyTemplate(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  >
                    {templates.map((t, i) => (
                      <option key={i} value={i}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тема</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Важно съобщение..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Съобщение</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 font-sans"
                    placeholder="Здравейте..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Поддържа се обикновен текст.</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                    {sendResult && (
                        <div className={`text-sm flex items-center ${sendResult.success ? "text-green-600" : "text-red-600"}`}>
                            {sendResult.success ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                            {sendResult.msg}
                        </div>
                    )}
                    <div className="flex-1"></div>
                    <button
                        type="submit"
                        disabled={sending}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Изпрати
                    </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="lg:col-span-1">
             <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Съвети</h3>
                <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                    <li>Използвайте ясни и кратки заглавия.</li>
                    <li>Проверете правописа преди изпращане.</li>
                    <li>Масовите съобщения се изпращат с нисък приоритет.</li>
                    <li>Можете да видите изпратените съобщения в таб "История".</li>
                </ul>
             </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
            {loadingLogs ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>
            ) : logs.length === 0 ? (
                <div className="p-12 text-center text-gray-500">Няма намерени записи.</div>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тема</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Получатели</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(log.sentAt).toLocaleString('bg-BG')}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {log.subject}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {Array.isArray(log.to) 
                                        ? `${log.to.length} recipients (${log.to.slice(0, 2).join(", ")}...)`
                                        : log.to}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      )}
    </div>
  );
}

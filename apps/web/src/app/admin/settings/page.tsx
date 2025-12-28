"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getIdTokenResult } from "firebase/auth";
import { Settings as SettingsIcon, AlertCircle, FileText, XCircle } from "lucide-react";

export default function OperatorSettingsPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"templates" | "reasons">("templates");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getIdTokenResult(user, false)
      .then((result) => {
        const roles = (result.claims.roles as string[]) || [];
        setIsAdmin(roles.includes("admin"));
        setLoading(false);
      })
      .catch(() => {
        setIsAdmin(false);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Зареждане...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Няма достъп</h1>
          <p className="text-gray-600">
            Настройките са достъпни само за администратори.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Настройки
        </h1>
        <p className="text-gray-600">Конфигурация на операторския модул</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === "templates"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileText className="h-5 w-5" />
            Шаблони за съобщения
          </button>
          <button
            onClick={() => setActiveTab("reasons")}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === "reasons"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <XCircle className="h-5 w-5" />
            Причини за отклоняване
          </button>
        </div>

        <div className="p-6">
          {activeTab === "templates" && <TemplatesSection />}
          {activeTab === "reasons" && <ReasonsSection />}
        </div>
      </div>
    </div>
  );
}

function TemplatesSection() {
  const templates = [
    {
      id: "1",
      name: "Потвърждение на сигнал",
      scope: "confirmation",
      body: "Здравейте,\n\nБлагодарим за подадения сигнал \"{title}\". Екипът ни потвърди получаването и ще пристъпи към преглед в рамките на 48 часа.\n\nАдрес: {address}\nСлучай ID: {case_id}"
    },
    {
      id: "2",
      name: "В процес на изпълнение",
      scope: "process_update",
      body: "Здравейте,\n\nВашият сигнал \"{title}\" е в процес на изпълнение. Очакваме разрешаване до {deadline}.\n\nБлагодарим за търпението!"
    },
    {
      id: "3",
      name: "Отклоняване",
      scope: "rejection",
      body: "Здравейте,\n\nСлед преглед, вашият сигнал \"{title}\" беше отклонен по следната причина:\n\n{reason}\n\nАко имате допълнителни въпроси, моля свържете се с нас."
    }
  ];

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-500">Scope: {template.scope}</p>
            </div>
            <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">
              Редактирай
            </button>
          </div>
          <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap font-mono">
            {template.body}
          </pre>
          <p className="text-xs text-gray-500 mt-2">
            Променливи: {"{title}"}, {"{address}"}, {"{case_id}"}, {"{deadline}"}, {"{reason}"}
          </p>
        </div>
      ))}

      <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors">
        + Добави нов шаблон
      </button>
    </div>
  );
}

function ReasonsSection() {
  const reasons = [
    { id: "1", label: "Извън компетентност", active: true },
    { id: "2", label: "Дублиран сигнал", active: true },
    { id: "3", label: "Недостатъчна информация", active: true },
    { id: "4", label: "Вече решен проблем", active: true },
    { id: "5", label: "Извън обхвата на общината", active: false }
  ];

  return (
    <div className="space-y-3">
      {reasons.map((reason) => (
        <div
          key={reason.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-gray-900 font-medium">{reason.label}</span>
            <span
              className={`px-2 py-1 text-xs rounded ${
                reason.active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {reason.active ? "Активна" : "Неактивна"}
            </span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
              {reason.active ? "Деактивирай" : "Активирай"}
            </button>
            <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
              Изтрий
            </button>
          </div>
        </div>
      ))}

      <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors">
        + Добави нова причина
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Download, Trash2, AlertTriangle, Loader2, Check, FileDown } from "lucide-react";

interface ExportStatus {
  id: string;
  status: "pending" | "ready" | "expired" | "failed";
  requested_at: number;
  ready_at?: number;
  expires_at?: number;
  size_bytes?: number;
}

export function DataPanel({ userId }: { userId: string }) {
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestExport() {
    setLoading(true);
    setError("");

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/me/export", {
        method: "POST",
        headers
      });

      if (res.status === 429) {
        setError("Максимум 2 експорта на ден. Моля, опитай утре.");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setExportStatus(data);
        
        // Poll for status
        pollExportStatus(data.export_id);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Грешка при заявка за експорт");
      }
    } catch (err) {
      setError("Грешка при свързване със сървъра");
    } finally {
      setLoading(false);
    }
  }

  async function pollExportStatus(exportId: string) {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const headers = await getIdTokenHeader();
        const res = await fetch(`/api/me/export/${exportId}`, { headers });
        
        if (res.ok) {
          const data = await res.json();
          setExportStatus(data);

          if (data.status === "ready" || data.status === "failed") {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Poll error:", err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 1000);

    // Store interval ID for cleanup
    return () => clearInterval(interval);
  }

  async function handleDownload() {
    if (!exportStatus) return;

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/me/export/${exportStatus.id}/download`, { headers });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `selnet-export-${exportStatus.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError("Грешка при сваляне на файла");
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("bg-BG");
  };

  return (
    <div className="space-y-6">
      {/* Export Data */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <Download className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Експорт на данни</h2>
            <p className="text-gray-600 mb-4">
              Свали копие на всичките си данни в JSON формат. Включва профилна информация, 
              сигнали, идеи, събития и коментари.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {exportStatus && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {exportStatus.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-800">Генериране на експорт...</span>
                  </div>
                )}
                {exportStatus.status === "ready" && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Експортът е готов!</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      Генериран: {formatDate(exportStatus.ready_at!)} • 
                      Размер: {formatBytes(exportStatus.size_bytes || 0)} • 
                      Изтича: {formatDate(exportStatus.expires_at!)}
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <FileDown className="h-4 w-4" />
                      Свали експорта
                    </button>
                  </div>
                )}
                {exportStatus.status === "expired" && (
                  <p className="text-sm text-gray-600">Експортът е изтекъл. Заяви нов.</p>
                )}
                {exportStatus.status === "failed" && (
                  <p className="text-sm text-red-800">Грешка при генериране на експорт</p>
                )}
              </div>
            )}

            <button
              onClick={handleRequestExport}
              disabled={loading || exportStatus?.status === "pending"}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Заявка...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {exportStatus ? "Нова заявка за експорт" : "Заявка за експорт"}
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Максимум 2 експорта на ден
            </p>
          </div>
        </div>
      </Card>

      {/* Delete Account */}
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Изтриване на профил</h2>
            <div className="flex items-start gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Перманентно действие!</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Всички данни ще бъдат изтрити след 30 дни</li>
                  <li>Публичните публикации стават анонимни</li>
                  <li>Действието може да се отмени до тогава</li>
                </ul>
              </div>
            </div>
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              onClick={() => {
                if (confirm("Сигурен ли си, че искаш да изтриеш профила си?")) {
                  alert("Изтриването изисква допълнително потвърждение (2FA/SMS)");
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Изтрий профила
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

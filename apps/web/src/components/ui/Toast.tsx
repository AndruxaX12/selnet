"use client";
import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  title: string;
  desc?: string;
  type?: ToastType;
}

interface ToastContextType {
  show: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full px-4 sm:px-0">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl shadow-lg border-2 transform transition-all duration-300 ease-out ${
              toast.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
              toast.type === "info" ? "bg-blue-50 border-blue-200 text-blue-800" :
              "bg-green-50 border-green-200 text-green-800"
            } animate-in slide-in-from-right-full`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  toast.type === "error" ? "bg-red-200" :
                  toast.type === "info" ? "bg-blue-200" :
                  "bg-green-200"
                }`}>
                  {toast.type === "error" ? "⚠" : toast.type === "info" ? "ℹ" : "✓"}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{toast.title}</div>
                  {toast.desc && <div className="text-xs mt-1 opacity-90">{toast.desc}</div>}
                </div>
              </div>
              <button
                onClick={() => remove(toast.id)}
                className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center text-xs transition-colors"
                aria-label="Затвори"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

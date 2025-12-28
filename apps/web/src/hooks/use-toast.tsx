import { useState, useCallback } from "react";
import { createContext, useContext, ReactNode } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id);
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const bgColor = {
    default: "bg-gray-900",
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-600"
  }[toast.variant || "default"];

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-right`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-semibold">{toast.title}</p>
          {toast.description && (
            <p className="text-sm opacity-90 mt-1">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-white opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

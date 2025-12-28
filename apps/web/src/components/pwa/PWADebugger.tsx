"use client";
import { useEffect, useState } from "react";

interface PWAStatus {
  serviceWorker: boolean;
  manifest: boolean;
  installable: boolean;
  standalone: boolean;
  online: boolean;
  caches: string[];
}

export default function PWADebugger() {
  const [status, setStatus] = useState<PWAStatus>({
    serviceWorker: false,
    manifest: false,
    installable: false,
    standalone: false,
    online: navigator.onLine,
    caches: []
  });
  const [show, setShow] = useState(false);

  useEffect(() => {
    checkPWAStatus();
    checkCaches();

    // Listen for online/offline events
    const handleOnline = () => setStatus(prev => ({ ...prev, online: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, online: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkPWAStatus = async () => {
    const newStatus = { ...status };

    // Check if Service Worker is registered
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      newStatus.serviceWorker = !!registration;
    }

    // Check if manifest is available
    const manifestLink = document.querySelector('link[rel="manifest"]');
    newStatus.manifest = !!manifestLink;

    // Check if running in standalone mode
    newStatus.standalone = window.matchMedia("(display-mode: standalone)").matches ||
                          (navigator as any).standalone === true;

    // Check if installable
    if ("BeforeInstallPromptEvent" in window) {
      newStatus.installable = true;
    }

    setStatus(newStatus);
  };

  const checkCaches = async () => {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      setStatus(prev => ({ ...prev, caches: cacheNames }));
    }
  };

  const clearCaches = async () => {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      checkCaches();
      console.log("All caches cleared");
    }
  };

  const testInstallPrompt = () => {
    const event = new CustomEvent("beforeinstallprompt", {
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-4 right-4 z-[9998] bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="PWA Debug"
      >
        🔧
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white border rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">PWA Debug</h3>
        <button
          onClick={() => setShow(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Service Worker:</span>
          <span className={status.serviceWorker ? "text-green-600" : "text-red-600"}>
            {status.serviceWorker ? "✅" : "❌"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Manifest:</span>
          <span className={status.manifest ? "text-green-600" : "text-red-600"}>
            {status.manifest ? "✅" : "❌"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Standalone:</span>
          <span className={status.standalone ? "text-green-600" : "text-gray-600"}>
            {status.standalone ? "✅" : "➖"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Online:</span>
          <span className={status.online ? "text-green-600" : "text-red-600"}>
            {status.online ? "✅" : "❌"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Installable:</span>
          <span className={status.installable ? "text-green-600" : "text-gray-600"}>
            {status.installable ? "✅" : "➖"}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <div className="text-xs text-gray-600 mb-2">
          Caches: {status.caches.length}
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearCaches}
            className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
          >
            Clear Caches
          </button>
          <button
            onClick={testInstallPrompt}
            className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
          >
            Test Install
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
        <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
        <div>URL: {window.location.href}</div>
      </div>
    </div>
  );
}

"use client";
import React from "react";

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props:any){ super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(){ return { hasError: true }; }
  componentDidCatch(error:any, info:any) { reportClientError(error, info?.componentStack); }
  render(){
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Възникна грешка
            </h1>
            <p className="text-gray-600 mb-4">
              Нещо се обърка в приложението. Моля, опитайте отново.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Презареди
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="border hover:bg-gray-50 px-3 py-2 rounded text-sm transition-colors"
              >
                Опитай отново
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function reportClientError(error: any, stack?: string) {
  const payload = {
    at: Date.now(),
    url: typeof location !== "undefined" ? location.pathname + location.search : "",
    referrer: typeof document !== "undefined" ? document.referrer : "unknown",
    msg: String(error?.message || error || "unknown"),
    stack: String(error?.stack || stack || "").slice(0, 8000),
    type: "boundary",
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "unknown"
  };

  console.error("🚨 Client error:", payload);

  fetch("/api/telemetry/error", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  }).catch((error) => {
    console.warn("⚠️ Error reporting failed:", error);
  });

  // Simplified - no Firebase analytics dependency to avoid circular imports
  console.log("Error tracked (no Firebase):", payload.msg);
}

// Глобални listeners
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    const payload = {
      at: Date.now(),
      url: location.pathname + location.search,
      referrer: document.referrer,
      msg: e.message,
      stack: e.error?.stack || "",
      type: "global",
      user_agent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };

    console.error("🚨 Global error:", payload);

    fetch("/api/telemetry/error", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    }).catch((error) => {
      console.warn("⚠️ Error reporting failed:", error);
    });

    // Simplified - no Firebase analytics dependency
    console.log("Global error tracked:", payload.msg);
  });

  window.addEventListener("unhandledrejection", (e:any) => {
    const payload = {
      at: Date.now(),
      url: location.pathname + location.search,
      referrer: document.referrer,
      msg: String(e.reason?.message || e.reason || "Unhandled promise rejection"),
      stack: e.reason?.stack || "",
      type: "promise",
      user_agent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };

    console.error("Unhandled promise rejection:", payload);

    fetch("/api/telemetry/error", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    }).catch((error) => {
      console.warn("Error reporting failed:", error);
    });
  });
}

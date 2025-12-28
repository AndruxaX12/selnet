"use client";

const ENDPOINT = "/api/telemetry/error";

export function initClientErrors() {
  if (typeof window === "undefined") return;

  const send = (payload: Record<string, unknown>) => {
    try {
      const body = JSON.stringify(payload);
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(ENDPOINT, body);
      }
    } catch (error) {
      console.warn("initClientErrors send failed", error);
    }
  };

  window.addEventListener(
    "error",
    (event) => {
      const payload = {
        msg: String(event.message || "error").slice(0, 500),
        src: String(event.filename || "").slice(0, 200),
        ln: event.lineno || 0,
        col: event.colno || 0,
        url: typeof location !== "undefined" ? location.pathname : ""
      };
      send(payload);
    },
    { capture: true }
  );

  window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent) => {
      const reason = (event && (event as any).reason) || "unhandledrejection";
      const message = typeof reason === "string" ? reason : reason?.message || "unhandledrejection";
      const payload = {
        msg: String(message).slice(0, 500),
        url: typeof location !== "undefined" ? location.pathname : ""
      };
      send(payload);
    }
  );
}

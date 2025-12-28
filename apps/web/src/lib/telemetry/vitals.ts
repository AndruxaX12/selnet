"use client";

import { onCLS, onFID, onLCP, onINP, onTTFB, type Metric } from "web-vitals";

const ENDPOINT = "/api/telemetry/vitals";
const SAMPLE_RATE = 1;

function send(metric: Metric) {
  if (Math.random() > SAMPLE_RATE) return;

  const body = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: (metric as any).rating || "",
    navType: typeof performance !== "undefined" ? (performance as any)?.navigation?.type ?? "" : "",
    url: typeof location !== "undefined" ? location.pathname : ""
  };

  const payload = JSON.stringify(body);
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(ENDPOINT, payload);
    return;
  }

  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => {});
}

export function initVitalsReporting() {
  try {
    onLCP(send);
    onINP(send);
    onCLS(send);
    onTTFB(send);
    onFID(send);
  } catch (error) {
    console.warn("initVitalsReporting failed", error);
  }
}

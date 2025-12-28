"use client";
import { getApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported, logEvent } from "firebase/analytics";
import { initializePerformance } from "firebase/performance";

let _ready = false;

export async function initAnalyticsAndPerf() {
  if (_ready) return;
  const app = getApp();

  try {
    if (await analyticsSupported()) {
      const analytics = getAnalytics(app);
      console.log("✅ Firebase Analytics initialized");

      // Track initial page view
      logEvent(analytics, "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }
  } catch (error) {
    console.warn("⚠️ Firebase Analytics not supported:", error);
  }

  try {
    const perf = initializePerformance(app);
    console.log("✅ Firebase Performance Monitoring initialized");

    // Track custom performance metrics
    if (perf) {
      // Monitor route changes
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log("📊 Navigation timing:", {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              networkLatency: navEntry.responseEnd - navEntry.requestStart
            });
          }
        }
      });

      observer.observe({ entryTypes: ["navigation"] });
    }
  } catch (error) {
    console.warn("⚠️ Firebase Performance Monitoring not supported:", error);
  }

  _ready = true;
}

export function track(name: string, params?: Record<string, any>) {
  try {
    const app = getApp();
    import("firebase/analytics").then(({ getAnalytics, logEvent }) => {
      const analytics = getAnalytics(app);
      logEvent(analytics, name, {
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        ...params
      });
    });
  } catch (error) {
    console.warn("⚠️ Analytics track failed:", error);
  }
}

export function trackCustomMetric(name: string, value: number, unit?: string) {
  try {
    const app = getApp();
    import("firebase/analytics").then(({ getAnalytics, logEvent }) => {
      const analytics = getAnalytics(app);
      logEvent(analytics, "custom_metric", {
        metric_name: name,
        metric_value: value,
        metric_unit: unit || "ms"
      });
    });
  } catch (error) {
    console.warn("⚠️ Custom metric tracking failed:", error);
  }
}

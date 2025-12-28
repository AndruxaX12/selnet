"use client";

import { useEffect } from "react";

const telemetryEnabled = process.env.NEXT_PUBLIC_ENABLE_TELEMETRY === "true";

export default function VitalsBoot() {
  useEffect(() => {
    if (!telemetryEnabled) {
      return;
    }

    let cancelled = false;

    import("@/lib/telemetry/vitals")
      .then((mod) => {
        if (cancelled) return;
        if (typeof mod.initVitalsReporting === "function") {
          mod.initVitalsReporting();
        }
      })
      .catch((error) => {
        console.warn("VitalsBoot init failed", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

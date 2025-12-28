"use client";

import { useEffect } from "react";

export default function ErrorsBoot() {
  useEffect(() => {
    let cancelled = false;

    import("@/lib/telemetry/errors")
      .then((mod) => {
        if (cancelled) return;
        if (typeof mod.initClientErrors === "function") {
          mod.initClientErrors();
        }
      })
      .catch((error) => {
        console.warn("ErrorsBoot init failed", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

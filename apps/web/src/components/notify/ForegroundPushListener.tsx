"use client";
import { useEffect } from "react";
import { onForegroundMessage } from "@/lib/messaging";
import { useToast } from "@/components/ui/Toast";

export default function ForegroundPushListener() {
  const { show } = useToast();

  useEffect(() => {
    const stop = onForegroundMessage(({ title, body }) => {
      if (!title && !body) return;
      show({ title: title || "Известие", desc: body || "" });
    });

    return () => {
      if (typeof stop === "function") {
        stop();
      }
    };
  }, [show]);

  return null;
}

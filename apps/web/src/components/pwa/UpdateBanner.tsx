"use client";
import { useEffect, useState } from "react";

export default function UpdateBanner() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(sw);
            setShow(true);
          }
        });
      });
    });
  }, []);

  function refresh() {
    if (waiting) {
      waiting.postMessage?.("SKIP_WAITING");
    }
    setTimeout(() => location.reload(), 250);
  }

  if (!show) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[9999] bg-black text-white text-sm rounded shadow px-3 py-2 flex items-center gap-3">
      Има нова версия на приложението.
      <button onClick={refresh} className="underline">Обнови</button>
      <button onClick={()=>setShow(false)} className="opacity-75">Затвори</button>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOnline(navigator.onLine);
      const on = () => setOnline(true), off = () => setOnline(false);
      window.addEventListener("online", on); window.addEventListener("offline", off);
      return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
    }
  }, []);
  if (online) return null;
  return (
    <div className="w-full bg-yellow-400 text-black text-center text-sm py-1">
      Офлайн режим — показваме кеширани данни.
    </div>
  );
}

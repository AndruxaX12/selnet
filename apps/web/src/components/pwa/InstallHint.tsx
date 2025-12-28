"use client";
import { useEffect, useState } from "react";

export default function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full border bg-white shadow px-4 py-2 text-sm">
      Инсталирай като приложение: Меню &rarr; &bdquo;Add to Home Screen&rdquo;
      <button onClick={()=>setShow(false)} className="ml-3 text-xs underline">Скрий</button>
    </div>
  );
}

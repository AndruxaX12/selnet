"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect device type
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);

    setIsIOS(ios);
    setIsMobile(mobile);

    // Show prompt after delay for mobile devices
    if (mobile) {
      console.log("Mobile device detected, will show install prompt");
      const timer = setTimeout(() => {
        console.log("Showing install prompt for mobile");
        setVisible(true);
      }, 1500); // Show after 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  // Show for mobile devices
  if (visible && isMobile) {
    return (
      <div className="fixed left-2 right-2 bottom-3 z-[9999] bg-white border rounded-lg shadow-xl p-4 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">
              📱 {isIOS ? "Инсталирай на iOS" : "Инсталирай СелНет"}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {isIOS
                ? 'Докосни ⤴️ Share → "Add to Home Screen"'
                : "Добави като приложение за по-бърз достъп"
              }
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setVisible(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              {isIOS ? "Разбрах" : "Инсталирай"}
            </button>
            <button
              onClick={() => setVisible(false)}
              className="border hover:bg-gray-50 px-3 py-2 rounded text-sm transition-colors"
            >
              По-късно
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

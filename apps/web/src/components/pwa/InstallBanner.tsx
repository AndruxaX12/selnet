"use client";
import { useState, useEffect } from "react";
import { triggerInstall } from "@/lib/pwa";
// import { vibrateLight, vibrateSelection } from "@/lib/mobile/haptics";
export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setMounted(true);

    const wasDismissed = sessionStorage.getItem('pwa-banner-dismissed') === 'true';
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted || dismissed) {
      return;
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt event fired - PWA ready to install");
      e.preventDefault();
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      console.log("App was installed");
      setIsInstalled(true);
      setShowBanner(false);
    };

    const handlePWAInstallable = () => {
      console.log("PWA installable event received");
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installable', handlePWAInstallable);

    // Force show banner for Android Chrome immediately for testing
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);

    let timer: NodeJS.Timeout;

    if (isAndroid && isChrome) {
      console.log('Android Chrome detected - forcing banner display');
      timer = setTimeout(() => {
        if (!isInstalled) {
          setShowBanner(true);
        }
      }, 500);
    } else {
      // Show banner after a delay for Chrome on Android
      timer = setTimeout(() => {
        if (!isInstalled) {
          if (isAndroid && isChrome) {
            console.log('Android Chrome detected - showing install banner');
            setShowBanner(true);
          } else {
            console.log('Not Android Chrome:', { isAndroid, isChrome, userAgent: navigator.userAgent });
          }
        }
      }, 1000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      if (timer) clearTimeout(timer);
    };
  }, [isInstalled, mounted, dismissed]);

  const handleInstall = () => {
    console.log('Install button clicked on mobile device');
    console.log('Debug info:', {
      userAgent: navigator.userAgent,
      platform: {
        isAndroid: /Android/.test(navigator.userAgent),
        isChrome: /Chrome/.test(navigator.userAgent),
        isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent)
      },
      timestamp: new Date().toISOString()
    });
    triggerInstall();
    // Don't hide banner immediately - let triggerInstall handle it
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    if (typeof window !== 'undefined') {
      // Don't show again for this session
      sessionStorage.setItem('pwa-banner-dismissed', 'true');
    }
  };

  // SSR-safe: Don't render anything until mounted on client
  if (!mounted) {
    return null;
  }

  // Force show banner for debugging on localhost
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const shouldShow = !dismissed && !isInstalled && (showBanner || isLocalhost);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-3 shadow-lg z-50 animate-slide-in-from-bottom-2 safe-bottom">
      <div className="max-w-6xl mx-auto">
        {/* Mobile layout */}
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🏠</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">Инсталирай СелНет</h3>
              <p className="text-xs opacity-90 truncate">
                {isLocalhost ? 'DEBUG: Тест режим' : 'Добави на началния екран'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={handleInstall}
              className="bg-white text-green-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Инсталирай сега
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white p-2 w-8 h-8 flex items-center justify-center"
              aria-label="Затвори"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏠</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Инсталирай СелНет</h3>
              <p className="text-sm opacity-90">Добави на началния екран</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstall}
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Инсталирай сега
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white p-2"
              aria-label="Затвори"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

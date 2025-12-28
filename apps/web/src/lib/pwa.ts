"use client";

export async function registerAppSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.log("Service Worker registered:", registration);
    
    // изчакваме активиране; не блокира UI
    await navigator.serviceWorker.ready;
    console.log("Service Worker ready");
    
    // Setup install prompt
  } catch (e) {
    console.error("Service Worker registration failed:", e);
  }
}

let deferredPrompt: any = null;
let isInstallPromptAvailable = false;

export function initPWA() {
  if (typeof window === 'undefined') return;

  console.log('Initializing PWA...');

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log("beforeinstallprompt event fired - PWA can be installed!");
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    isInstallPromptAvailable = true;
    
    // Show our custom install banner
    showInstallBanner();
  });

  // Listen for the appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed successfully!');
    deferredPrompt = null;
    isInstallPromptAvailable = false;
  });

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('PWA is already installed');
    return;
  }

  // For debugging - log current state
  setTimeout(() => {
    console.log('PWA state check:', {
      deferredPrompt: !!deferredPrompt,
      isInstallPromptAvailable,
      userAgent: navigator.userAgent,
      standalone: window.matchMedia('(display-mode: standalone)').matches
    });
  }, 1000);
}

function showInstallBanner() {
  // Custom banner is handled by InstallBanner component
  console.log("PWA can be installed - banner should show");
  window.dispatchEvent(new CustomEvent('pwa-installable'));
}

export function triggerInstall() {
  console.log('triggerInstall called', {
    deferredPrompt: !!deferredPrompt,
    isInstallPromptAvailable,
    userAgent: navigator.userAgent
  });

  if (deferredPrompt && isInstallPromptAvailable) {
    console.log('Showing native install prompt...');

    try {
      // Показваме браузърския install prompt
      deferredPrompt.prompt();

      // Чакаме избора на потребителя
      deferredPrompt.userChoice.then((choiceResult: any) => {
        console.log('Install prompt result:', choiceResult.outcome);

        if (choiceResult.outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
        } else {
          console.log('❌ User dismissed the install prompt');
        }

        // Почистваме prompt-а
        deferredPrompt = null;
        isInstallPromptAvailable = false;
      }).catch((error: any) => {
        console.error('Error with install prompt:', error);
      });

    } catch (error) {
      console.error('Failed to show install prompt:', error);
    }

  } else {
    console.log('Install prompt not available:', {
      deferredPrompt: !!deferredPrompt,
      isInstallPromptAvailable,
      reason: !deferredPrompt ? 'No deferred prompt' : 'Prompt not available'
    });

    // Показваме по-точни инструкции за различните браузъри
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !isChrome;

    if (isAndroid && isChrome) {
      alert('За да инсталирате СелНет като приложение:\n\n1. Докоснете бутона "Инсталирай" по-горе\n2. Изчакайте да се покаже диалоговия прозорец\n3. Изберете "Инсталирай" или "Добави"\n\nАко не се покаже диалог, опитайте:\n• Обновете страницата\n• Разрешете изскачащите прозорци за този сайт');
    } else if (isIOS && isSafari) {
      alert('За да инсталирате СелНет на iPhone/iPad:\n\n1. Докоснете бутона Share (⬆️) в Safari\n2. Превъртете надолу и изберете "Add to Home Screen"\n3. Докоснете "Добави" в горния десен ъгъл');
    } else if (isFirefox) {
      alert('За да инсталирате СелНет във Firefox:\n\n1. Докоснете менюто (⋮) в горния десен ъгъл\n2. Изберете "Install This Site as an App"\n3. Докоснете "Install"');
    } else {
      alert('За да инсталирате СелНет:\n\n1. Потърсете опция "Install app" или "Add to Home Screen" в менюто на браузъра\n2. Следвайте инструкциите на екрана\n\nПоддържани браузъри: Chrome (Android), Safari (iOS), Firefox');
    }
  }
}

export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

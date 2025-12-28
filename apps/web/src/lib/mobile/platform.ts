"use client";

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  version: string;
  browser: string;
  hasNotch: boolean;
  supportsPWA: boolean;
}

class PlatformDetector {
  private info: PlatformInfo;

  constructor() {
    this.info = this.detectPlatform();
  }

  private detectPlatform(): PlatformInfo {
    if (typeof window === 'undefined') {
      return {
        isIOS: false,
        isAndroid: false,
        isMobile: false,
        isStandalone: false,
        version: '',
        browser: '',
        hasNotch: false,
        supportsPWA: false
      };
    }

    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isMobile = isIOS || isAndroid || /Mobile/.test(userAgent);
    
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;

    // Detect browser
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'chrome';
    else if (userAgent.includes('Safari')) browser = 'safari';
    else if (userAgent.includes('Firefox')) browser = 'firefox';
    else if (userAgent.includes('Edge')) browser = 'edge';

    // Extract version
    let version = '';
    if (isIOS) {
      const match = userAgent.match(/OS (\d+)_(\d+)/);
      if (match) version = `${match[1]}.${match[2]}`;
    } else if (isAndroid) {
      const match = userAgent.match(/Android (\d+\.?\d*)/);
      if (match) version = match[1];
    }

    // Check for notch (iPhone X and newer)
    const hasNotch = isIOS && (
      window.screen.height === 812 || // iPhone X, XS
      window.screen.height === 896 || // iPhone XR, XS Max
      window.screen.height === 844 || // iPhone 12, 12 Pro
      window.screen.height === 926 || // iPhone 12 Pro Max
      window.screen.height === 932    // iPhone 14 Pro Max
    );

    // Check PWA support
    const supportsPWA = 'serviceWorker' in navigator && 
                       'PushManager' in window &&
                       'Notification' in window;

    return {
      isIOS,
      isAndroid,
      isMobile,
      isStandalone,
      version,
      browser,
      hasNotch,
      supportsPWA
    };
  }

  public get platform(): PlatformInfo {
    return this.info;
  }

  // Convenience methods
  public get isIOS(): boolean {
    return this.info.isIOS;
  }

  public get isAndroid(): boolean {
    return this.info.isAndroid;
  }

  public get isMobile(): boolean {
    return this.info.isMobile;
  }

  public get isStandalone(): boolean {
    return this.info.isStandalone;
  }

  public get hasNotch(): boolean {
    return this.info.hasNotch;
  }

  // Get platform-specific CSS classes
  public getCSSClasses(): string[] {
    const classes: string[] = [];
    
    if (this.info.isIOS) classes.push('platform-ios');
    if (this.info.isAndroid) classes.push('platform-android');
    if (this.info.isMobile) classes.push('platform-mobile');
    if (this.info.isStandalone) classes.push('platform-standalone');
    if (this.info.hasNotch) classes.push('platform-notch');
    
    classes.push(`browser-${this.info.browser}`);
    
    return classes;
  }

  // Get safe area insets
  public getSafeAreaInsets() {
    if (typeof window === 'undefined') {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const style = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
    };
  }

  // Check if device supports specific features
  public supports = {
    vibration: (): boolean => {
      return 'vibrate' in navigator;
    },
    
    camera: (): boolean => {
      return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    },
    
    geolocation: (): boolean => {
      return 'geolocation' in navigator;
    },
    
    notifications: (): boolean => {
      return 'Notification' in window;
    },
    
    serviceWorker: (): boolean => {
      return 'serviceWorker' in navigator;
    },
    
    backgroundSync: (): boolean => {
      return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
    },
    
    webShare: (): boolean => {
      return 'share' in navigator;
    },
    
    installPrompt: (): boolean => {
      return this.info.isAndroid || (this.info.isIOS && this.info.browser === 'safari');
    }
  };
}

// Export singleton instance
export const platform = new PlatformDetector();

// Utility functions
export const isIOS = () => platform.isIOS;
export const isAndroid = () => platform.isAndroid;
export const isMobile = () => platform.isMobile;
export const isStandalone = () => platform.isStandalone;
export const hasNotch = () => platform.hasNotch;

// Platform-specific optimizations
export const applyPlatformOptimizations = () => {
  if (typeof document === 'undefined') return;

  const classes = platform.getCSSClasses();
  document.documentElement.classList.add(...classes);

  // iOS specific optimizations
  if (platform.isIOS) {
    // Prevent zoom on input focus
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }

    // Add iOS status bar styling
    const statusBarMeta = document.createElement('meta');
    statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
    statusBarMeta.content = 'default';
    document.head.appendChild(statusBarMeta);

    // Add iOS app capable meta
    const appCapableMeta = document.createElement('meta');
    appCapableMeta.name = 'apple-mobile-web-app-capable';
    appCapableMeta.content = 'yes';
    document.head.appendChild(appCapableMeta);
  }

  // Android specific optimizations
  if (platform.isAndroid) {
    // Add Android theme color
    const themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    themeColorMeta.content = '#111111';
    document.head.appendChild(themeColorMeta);
  }

  // Standalone mode optimizations
  if (platform.isStandalone) {
    document.documentElement.classList.add('standalone-mode');
    
    // Hide address bar on scroll for better immersion
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        document.documentElement.style.setProperty('--header-transform', 'translateY(-100%)');
      } else {
        // Scrolling up
        document.documentElement.style.setProperty('--header-transform', 'translateY(0)');
      }
      lastScrollTop = scrollTop;
    }, { passive: true });
  }
};

// Hook for React components
export const usePlatform = () => {
  return platform.platform;
};

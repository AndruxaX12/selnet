"use client";
import { lazy, Suspense } from 'react';
import { vibrateLight } from '@/lib/mobile/haptics';

// Loading component with skeleton
function LoadingSkeleton({ type = 'default' }: { type?: 'default' | 'card' | 'list' | 'form' }) {
  const getSkeletonContent = () => {
    switch (type) {
      case 'card':
        return (
          <div className="border rounded-lg p-4 animate-pulse">
            <div className="bg-gray-200 h-4 w-3/4 mb-2 rounded"></div>
            <div className="bg-gray-200 h-3 w-full mb-1 rounded"></div>
            <div className="bg-gray-200 h-3 w-2/3 rounded"></div>
          </div>
        );
      case 'list':
        return (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="bg-gray-200 w-12 h-12 rounded-full"></div>
                <div className="flex-1">
                  <div className="bg-gray-200 h-4 w-3/4 mb-1 rounded"></div>
                  <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'form':
        return (
          <div className="space-y-4 animate-pulse">
            <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
            <div className="bg-gray-200 h-10 w-full rounded"></div>
            <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
            <div className="bg-gray-200 h-20 w-full rounded"></div>
            <div className="bg-gray-200 h-10 w-32 rounded"></div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Зарежда...</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {getSkeletonContent()}
    </div>
  );
}

// Error boundary component
function ErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Грешка при зареждане</h3>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={() => {
          vibrateLight();
          retry();
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Опитай отново
      </button>
    </div>
  );
}

// Lazy loaded components
export const LazyNotificationSettings = lazy(() => 
  import('@/components/notifications/NotificationSettings').then(module => ({
    default: module.default
  }))
);

export const LazyOfflineApp = lazy(() => 
  import('@/components/offline/OfflineApp').then(module => ({
    default: module.default
  }))
);

export const LazyCameraUpload = lazy(() => 
  import('@/components/mobile/CameraUpload').then(module => ({
    default: module.default
  }))
);

export const LazyBottomNavigation = lazy(() => 
  import('@/components/mobile/BottomNavigation').then(module => ({
    default: module.default
  }))
);

export const LazySwipeableCards = lazy(() => 
  import('@/components/mobile/SwipeableCards').then(module => ({
    default: module.default
  }))
);

// HOC for lazy loading with proper error handling
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  loadingType: 'default' | 'card' | 'list' | 'form' = 'default'
) {
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={<LoadingSkeleton type={loadingType} />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Preload function for critical components
export const preloadComponents = {
  notificationSettings: () => import('@/components/notifications/NotificationSettings'),
  offlineApp: () => import('@/components/offline/OfflineApp'),
  cameraUpload: () => import('@/components/mobile/CameraUpload'),
  bottomNavigation: () => import('@/components/mobile/BottomNavigation'),
  swipeableCards: () => import('@/components/mobile/SwipeableCards')
};

// Preload on user interaction
export const preloadOnHover = (componentName: keyof typeof preloadComponents) => {
  return {
    onMouseEnter: () => preloadComponents[componentName](),
    onTouchStart: () => preloadComponents[componentName]()
  };
};

// Dynamic import with retry logic
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Resource preloader
export class ResourcePreloader {
  private preloadedResources = new Set<string>();

  async preloadImage(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  async preloadImages(sources: string[]): Promise<void> {
    await Promise.all(sources.map(src => this.preloadImage(src)));
  }

  preloadFont(fontFamily: string, src: string): void {
    if (this.preloadedResources.has(src)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = src;
    document.head.appendChild(link);
    
    this.preloadedResources.add(src);
  }

  isPreloaded(resource: string): boolean {
    return this.preloadedResources.has(resource);
  }
}

export const resourcePreloader = new ResourcePreloader();

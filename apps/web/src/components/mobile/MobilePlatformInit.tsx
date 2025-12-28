"use client";
import { useEffect } from 'react';
import { applyPlatformOptimizations, platform } from '@/lib/mobile/platform';

export default function MobilePlatformInit() {
  useEffect(() => {
    // Apply platform-specific optimizations
    applyPlatformOptimizations();

    // Log platform info for debugging
    console.log('Platform detected:', platform.platform);

    // Add viewport height CSS custom property for mobile
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    // Prevent default touch behaviors that interfere with PWA
    const preventDefaultTouch = (e: TouchEvent) => {
      // Prevent pull-to-refresh on iOS Safari
      if (e.touches.length > 1) return;
      
      const touch = e.touches[0];
      const element = touch.target as Element;
      
      // Allow scrolling in scrollable areas
      if (element.closest('[data-scrollable]')) return;
      
      // Prevent bounce effect on iOS
      if (platform.isIOS && window.scrollY === 0 && touch.clientY > 0) {
        e.preventDefault();
      }
    };

    // Add touch event listeners
    document.addEventListener('touchstart', preventDefaultTouch, { passive: false });

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      document.removeEventListener('touchstart', preventDefaultTouch);
    };
  }, []);

  return null; // This component doesn't render anything
}

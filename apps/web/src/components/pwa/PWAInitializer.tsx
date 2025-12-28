"use client";
import { useEffect } from "react";
import { registerAppSW, initPWA } from "@/lib/pwa";

export default function PWAInitializer() {
  useEffect(() => {
    // Skip PWA initialization in development to prevent conflicts
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

    if (isDevelopment) {
      console.log('PWAInitializer: Skipping in development mode');
      return;
    }

    console.log('PWAInitializer mounting...');

    // Initialize service worker and PWA features
    registerAppSW().then(() => {
      console.log('Service Worker registered, initializing PWA...');
      // Initialize PWA install prompt handling after SW is ready
      initPWA();
    }).catch((error) => {
      console.error('Service Worker registration failed:', error);
      // Still try to initialize PWA features
      initPWA();
    });
  }, []);

  return null;
}

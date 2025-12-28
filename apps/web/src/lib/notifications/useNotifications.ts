"use client";
import { useState, useEffect, useCallback } from 'react';
import { notificationManager, NotificationOptions, NotificationPermission } from './NotificationManager';

interface UseNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  showNotification: (options: NotificationOptions) => Promise<void>;
  showSignalNotification: (signal: any) => Promise<void>;
  showEventNotification: (event: any) => Promise<void>;
  closeNotification: (tag: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isSupported = notificationManager.isSupported;

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      setIsLoading(true);
      
      try {
        // Get permission status
        const currentPermission = notificationManager.getPermission();
        setPermission(currentPermission);

        // Get subscription status
        if (currentPermission === 'granted') {
          const { isSubscribed: subscribed } = await notificationManager.getSubscriptionStatus();
          setIsSubscribed(subscribed);
        }
      } catch (error) {
        console.error('Failed to load notification state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isSupported) {
      loadInitialState();
    } else {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const newPermission = await notificationManager.requestPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Failed to request permission:', error);
      return 'denied';
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Request permission first if needed
      const currentPermission = permission === 'default' 
        ? await requestPermission() 
        : permission;

      if (currentPermission !== 'granted') {
        return false;
      }

      const subscription = await notificationManager.subscribeToPush();
      const success = !!subscription;
      setIsSubscribed(success);
      
      return success;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await notificationManager.unsubscribeFromPush();
      setIsSubscribed(!success);
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Show notification
  const showNotification = useCallback(async (options: NotificationOptions): Promise<void> => {
    try {
      await notificationManager.showNotification(options);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }, []);

  // Show signal notification
  const showSignalNotification = useCallback(async (signal: any): Promise<void> => {
    try {
      await notificationManager.showSignalNotification(signal);
    } catch (error) {
      console.error('Failed to show signal notification:', error);
    }
  }, []);

  // Show event notification
  const showEventNotification = useCallback(async (event: any): Promise<void> => {
    try {
      await notificationManager.showEventNotification(event);
    } catch (error) {
      console.error('Failed to show event notification:', error);
    }
  }, []);

  // Close notification
  const closeNotification = useCallback(async (tag: string): Promise<void> => {
    try {
      await notificationManager.closeNotification(tag);
    } catch (error) {
      console.error('Failed to close notification:', error);
    }
  }, []);

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    showSignalNotification,
    showEventNotification,
    closeNotification
  };
}

// Hook for notification settings
export function useNotificationSettings() {
  const [settings, setSettings] = useState({
    signals: true,
    events: true,
    updates: true,
    marketing: false
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('notification-settings', JSON.stringify(updatedSettings));
  }, [settings]);

  return {
    settings,
    updateSettings
  };
}

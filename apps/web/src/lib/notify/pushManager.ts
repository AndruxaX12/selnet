"use client";
import { useState, useEffect, useCallback } from "react";

// Types for push notifications
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  url?: string;
  type?: "default" | "signal" | "idea" | "event" | "system";
  channel?: "signals" | "ideas" | "events" | "system";
  priority?: "normal" | "high" | "urgent";
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: NotificationAction[];
  customData?: Record<string, any>;
  notificationId?: string;
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
  serviceWorkerReady: boolean;
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private permissionState: NotificationPermissionState = {
    permission: "default",
    supported: false,
    serviceWorkerReady: false
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  private async initialize() {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      console.log("Push notifications not supported");
      return;
    }

    this.permissionState.supported = true;
    this.permissionState.permission = Notification.permission;

    try {
      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/"
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", this.handleServiceWorkerMessage);

      // Check if service worker is ready
      if (this.serviceWorkerRegistration.active) {
        this.permissionState.serviceWorkerReady = true;
        this.notifyStateChange();
      }

      // Listen for service worker changes
      this.serviceWorkerRegistration.addEventListener("updatefound", () => {
        const newWorker = this.serviceWorkerRegistration!.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated") {
              this.permissionState.serviceWorkerReady = true;
              this.notifyStateChange();
            }
          });
        }
      });

      console.log("Push notification manager initialized");
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
    }
  }

  private handleServiceWorkerMessage = (event: MessageEvent) => {
    console.log("Service worker message:", event.data);

    if (event.data.type === "NOTIFICATION_PERMISSION") {
      this.permissionState.permission = event.data.permission;
      this.notifyStateChange();
    }
  };

  private notifyStateChange() {
    // Notify any listeners about state changes
    window.dispatchEvent(new CustomEvent("notification-state-change", {
      detail: this.permissionState
    }));
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.permissionState.supported) {
      throw new Error("Push notifications not supported");
    }

    if (this.permissionState.permission === "granted") {
      return "granted";
    }

    if (this.permissionState.permission === "denied") {
      throw new Error("Notification permission denied");
    }

    const permission = await Notification.requestPermission();
    this.permissionState.permission = permission;
    this.notifyStateChange();

    return permission;
  }

  // Send push notification
  async sendNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.permissionState.supported) {
      throw new Error("Push notifications not supported");
    }

    if (this.permissionState.permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    if (!this.serviceWorkerRegistration) {
      throw new Error("Service worker not ready");
    }

    // Send to service worker
    this.serviceWorkerRegistration.active?.postMessage({
      type: "SHOW_NOTIFICATION",
      payload: {
        ...payload,
        timestamp: Date.now()
      }
    });
  }

  // Subscribe to push notifications (for server push)
  async subscribeToPush(vapidKey: string): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error("Service worker not ready");
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      console.log("Push subscription:", subscription);
      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      return null;
    }
  }

  // Get current permission state
  getPermissionState(): NotificationPermissionState {
    return { ...this.permissionState };
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return this.permissionState.supported;
  }

  // Test notification
  async testNotification(): Promise<void> {
    await this.sendNotification({
      title: "Тестово известие",
      body: "Това е тестово известие за проверка на функционалността",
      type: "system",
      priority: "normal",
      url: "/me/notifications"
    });
  }
}

// React hook for push notifications
export function usePushNotifications() {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: "default",
    supported: false,
    serviceWorkerReady: false
  });

  const manager = PushNotificationManager.getInstance();

  useEffect(() => {
    // Initial state
    setPermissionState(manager.getPermissionState());

    // Listen for state changes
    const handleStateChange = (event: CustomEvent) => {
      setPermissionState(event.detail);
    };

    window.addEventListener("notification-state-change", handleStateChange as EventListener);

    return () => {
      window.removeEventListener("notification-state-change", handleStateChange as EventListener);
    };
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const permission = await manager.requestPermission();
      return permission;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      throw error;
    }
  }, [manager]);

  const sendNotification = useCallback(async (payload: PushNotificationPayload) => {
    try {
      await manager.sendNotification(payload);
    } catch (error) {
      console.error("Failed to send notification:", error);
      throw error;
    }
  }, [manager]);

  const testNotification = useCallback(async () => {
    try {
      await manager.testNotification();
    } catch (error) {
      console.error("Failed to send test notification:", error);
      throw error;
    }
  }, [manager]);

  return {
    permissionState,
    requestPermission,
    sendNotification,
    testNotification,
    isSupported: manager.isSupported()
  };
}

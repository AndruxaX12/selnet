/**
 * NotificationService - Manages browser push notifications
 * 
 * Features:
 * - Request notification permission
 * - Subscribe/unsubscribe to push notifications
 * - Send test notifications
 * - Manage notification preferences
 * 
 * Usage:
 * const notificationService = new NotificationService();
 * await notificationService.initialize();
 * await notificationService.requestPermission();
 */

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private permission: NotificationPermission = "default";

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return false;
    }

    this.permission = Notification.permission;
    this.isInitialized = true;
    return true;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!("Notification" in window)) {
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  /**
   * Check if notifications are supported and granted
   */
  isSupported(): boolean {
    return "Notification" in window;
  }

  /**
   * Check if notification permission is granted
   */
  isGranted(): boolean {
    return this.permission === "granted";
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  /**
   * Show a local notification
   */
  async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isGranted()) {
      console.warn("Notification permission not granted");
      return false;
    }

    try {
      new Notification(title, {
        icon: "/logo-selnet.png",
        badge: "/logo-selnet.png",
        ...options,
      });
      return true;
    } catch (error) {
      console.error("Error showing notification:", error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   * TODO: Implement with service worker and push API
   */
  async subscribe(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isGranted()) {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    // TODO: Implement service worker registration
    // TODO: Get push subscription from service worker
    // TODO: Send subscription to backend

    console.log("Push subscription - To be implemented");
    return true;
  }

  /**
   * Unsubscribe from push notifications
   * TODO: Implement with service worker and push API
   */
  async unsubscribe(): Promise<boolean> {
    // TODO: Get push subscription from service worker
    // TODO: Unsubscribe
    // TODO: Remove subscription from backend

    console.log("Push unsubscription - To be implemented");
    return true;
  }

  /**
   * Send a test notification
   */
  async sendTestNotification(): Promise<boolean> {
    return this.showNotification("СелНет Тест", {
      body: "Това е тестово известие. Известията работят правилно!",
      tag: "test-notification",
      requireInteraction: false,
    });
  }

  /**
   * Show signal notification
   */
  async notifyNewSignal(
    signalTitle: string,
    signalLocation: string,
    signalId: string
  ): Promise<boolean> {
    return this.showNotification(`Нов сигнал: ${signalTitle}`, {
      body: `Местоположение: ${signalLocation}`,
      tag: `signal-${signalId}`,
      data: { signalId, type: "new_signal" },
    });
  }

  /**
   * Show signal status update notification
   */
  async notifySignalUpdate(
    signalTitle: string,
    newStatus: string,
    signalId: string
  ): Promise<boolean> {
    return this.showNotification(`Актуализация: ${signalTitle}`, {
      body: `Нов статус: ${newStatus}`,
      tag: `signal-update-${signalId}`,
      data: { signalId, type: "signal_update" },
    });
  }

  /**
   * Show location alert notification
   */
  async notifyLocationAlert(
    alertTitle: string,
    alertBody: string,
    location: string
  ): Promise<boolean> {
    return this.showNotification(alertTitle, {
      body: `${alertBody}\n📍 ${location}`,
      tag: `location-alert-${Date.now()}`,
      requireInteraction: true,
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

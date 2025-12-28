import { PushNotificationPayload } from "./pushManager";
import { NotificationFactory } from "./templates";

// Types for scheduled notifications
export interface ScheduledNotification {
  id: string;
  payload: PushNotificationPayload;
  scheduledTime: number; // Unix timestamp
  status: "pending" | "delivered" | "cancelled" | "failed";
  createdAt: number;
  deliveredAt?: number;
  attempts: number;
  maxAttempts: number;
  userId: string;
  metadata?: Record<string, any>;
}

export interface ScheduleOptions {
  delay?: number; // Delay in milliseconds
  specificTime?: Date; // Specific time to deliver
  recurring?: {
    interval: number; // Interval in milliseconds
    endTime?: number; // When to stop recurring
    maxOccurrences?: number; // Maximum number of deliveries
  };
  conditions?: {
    userOnline?: boolean; // Only deliver if user is online
    userActive?: boolean; // Only deliver if user is active
    customCheck?: () => Promise<boolean>; // Custom condition function
  };
  retryPolicy?: {
    maxAttempts: number;
    backoffMultiplier: number; // Exponential backoff multiplier
    initialDelay: number; // Initial delay between retries
  };
}

// Notification Scheduler Class
export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // Check every minute
  private readonly STORAGE_KEY = "scheduledNotifications";

  private constructor() {
    this.loadFromStorage();
    this.startScheduler();
  }

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  // Schedule a notification for immediate delivery
  scheduleNow(payload: PushNotificationPayload, userId: string, options?: Partial<ScheduleOptions>): string {
    const notificationId = this.generateId();

    const notification: ScheduledNotification = {
      id: notificationId,
      payload,
      scheduledTime: Date.now(),
      status: "pending",
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: options?.retryPolicy?.maxAttempts || 3,
      userId,
      metadata: options?.metadata
    };

    this.scheduledNotifications.set(notificationId, notification);
    this.saveToStorage();
    this.processNotification(notification);

    return notificationId;
  }

  // Schedule a notification with delay
  scheduleWithDelay(payload: PushNotificationPayload, userId: string, delayMs: number, options?: Partial<ScheduleOptions>): string {
    const notificationId = this.generateId();

    const notification: ScheduledNotification = {
      id: notificationId,
      payload,
      scheduledTime: Date.now() + delayMs,
      status: "pending",
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: options?.retryPolicy?.maxAttempts || 3,
      userId,
      metadata: options?.metadata
    };

    this.scheduledNotifications.set(notificationId, notification);
    this.saveToStorage();

    console.log(`Notification scheduled for ${new Date(notification.scheduledTime).toLocaleString()}`);

    return notificationId;
  }

  // Schedule a notification for a specific time
  scheduleAtTime(payload: PushNotificationPayload, userId: string, specificTime: Date, options?: Partial<ScheduleOptions>): string {
    if (specificTime.getTime() <= Date.now()) {
      throw new Error("Scheduled time must be in the future");
    }

    const notificationId = this.generateId();

    const notification: ScheduledNotification = {
      id: notificationId,
      payload,
      scheduledTime: specificTime.getTime(),
      status: "pending",
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: options?.retryPolicy?.maxAttempts || 3,
      userId,
      metadata: options?.metadata
    };

    this.scheduledNotifications.set(notificationId, notification);
    this.saveToStorage();

    console.log(`Notification scheduled for ${specificTime.toLocaleString()}`);

    return notificationId;
  }

  // Schedule recurring notifications
  scheduleRecurring(payload: PushNotificationPayload, userId: string, intervalMs: number, options: ScheduleOptions): string[] {
    const notificationIds: string[] = [];
    const now = Date.now();
    let nextTime = now;
    let occurrences = 0;
    const maxOccurrences = options.recurring?.maxOccurrences || 10;

    while (occurrences < maxOccurrences && (!options.recurring?.endTime || nextTime < options.recurring.endTime)) {
      const notificationId = this.generateId();

      const notification: ScheduledNotification = {
        id: notificationId,
        payload: {
          ...payload,
          tag: `${payload.tag || 'recurring'}-${occurrences + 1}`
        },
        scheduledTime: nextTime,
        status: "pending",
        createdAt: Date.now(),
        attempts: 0,
        maxAttempts: options.retryPolicy?.maxAttempts || 3,
        userId,
        metadata: {
          ...options.metadata,
          occurrence: occurrences + 1,
          isRecurring: true,
          parentScheduleId: notificationIds[0] // First notification ID as parent
        }
      };

      this.scheduledNotifications.set(notificationId, notification);
      notificationIds.push(notificationId);

      nextTime += intervalMs;
      occurrences++;
    }

    this.saveToStorage();
    console.log(`Scheduled ${notificationIds.length} recurring notifications`);

    return notificationIds;
  }

  // Cancel a scheduled notification
  cancel(notificationId: string): boolean {
    const notification = this.scheduledNotifications.get(notificationId);

    if (!notification) {
      return false;
    }

    if (notification.status === "delivered") {
      return false; // Can't cancel delivered notifications
    }

    notification.status = "cancelled";
    this.scheduledNotifications.set(notificationId, notification);
    this.saveToStorage();

    console.log(`Cancelled notification ${notificationId}`);
    return true;
  }

  // Cancel all notifications for a user
  cancelAllForUser(userId: string): number {
    let cancelledCount = 0;

    for (const [id, notification] of this.scheduledNotifications) {
      if (notification.userId === userId && notification.status === "pending") {
        notification.status = "cancelled";
        this.scheduledNotifications.set(id, notification);
        cancelledCount++;
      }
    }

    if (cancelledCount > 0) {
      this.saveToStorage();
      console.log(`Cancelled ${cancelledCount} notifications for user ${userId}`);
    }

    return cancelledCount;
  }

  // Get scheduled notifications for a user
  getScheduledForUser(userId: string, status?: string): ScheduledNotification[] {
    const notifications: ScheduledNotification[] = [];

    for (const notification of this.scheduledNotifications.values()) {
      if (notification.userId === userId && (!status || notification.status === status)) {
        notifications.push(notification);
      }
    }

    return notifications.sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  // Get all pending notifications
  getPendingNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values())
      .filter(n => n.status === "pending" && n.scheduledTime <= Date.now())
      .sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  // Start the scheduler
  private startScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.checkAndDeliverNotifications();
    }, this.CHECK_INTERVAL);

    // Also check immediately
    this.checkAndDeliverNotifications();
  }

  // Check and deliver due notifications
  private async checkAndDeliverNotifications() {
    const pending = this.getPendingNotifications();

    for (const notification of pending) {
      await this.processNotification(notification);
    }
  }

  // Process a single notification
  private async processNotification(notification: ScheduledNotification) {
    if (notification.status !== "pending" || notification.scheduledTime > Date.now()) {
      return;
    }

    // Check conditions before delivering
    if (!(await this.checkConditions(notification))) {
      console.log(`Conditions not met for notification ${notification.id}`);
      return;
    }

    try {
      // Try to deliver the notification
      await this.deliverNotification(notification);

      notification.status = "delivered";
      notification.deliveredAt = Date.now();
      notification.attempts++;

      console.log(`Successfully delivered notification ${notification.id}`);
    } catch (error) {
      console.error(`Failed to deliver notification ${notification.id}:`, error);

      notification.attempts++;

      if (notification.attempts >= notification.maxAttempts) {
        notification.status = "failed";
        console.error(`Notification ${notification.id} failed after ${notification.attempts} attempts`);
      } else {
        // Schedule retry with exponential backoff
        const retryDelay = this.calculateRetryDelay(notification.attempts);
        notification.scheduledTime = Date.now() + retryDelay;
        console.log(`Retrying notification ${notification.id} in ${retryDelay}ms`);
      }
    }

    this.scheduledNotifications.set(notification.id, notification);
    this.saveToStorage();
  }

  // Check delivery conditions
  private async checkConditions(notification: ScheduledNotification): Promise<boolean> {
    // Check if user is online (if required)
    if (notification.metadata?.conditions?.userOnline) {
      if (!navigator.onLine) {
        return false;
      }
    }

    // Check if user is active (if required)
    if (notification.metadata?.conditions?.userActive) {
      // Check if user has interacted with the page recently
      const lastActivity = this.getLastUserActivity();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

      if (lastActivity < fiveMinutesAgo) {
        return false;
      }
    }

    // Check custom conditions
    if (notification.metadata?.conditions?.customCheck) {
      try {
        return await notification.metadata.conditions.customCheck();
      } catch (error) {
        console.error("Custom condition check failed:", error);
        return false;
      }
    }

    return true;
  }

  // Deliver notification using push manager
  private async deliverNotification(notification: ScheduledNotification): Promise<void> {
    // Try to send via service worker first
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: "SHOW_NOTIFICATION",
          payload: notification.payload
        });
        return;
      } catch (error) {
        console.warn("Service worker delivery failed, falling back to in-app notification:", error);
      }
    }

    // Fallback to in-app notification
    this.showInAppNotification(notification.payload);
  }

  // Show in-app notification as fallback
  private showInAppNotification(payload: PushNotificationPayload) {
    // Create a browser notification if permission is granted
    if (Notification.permission === "granted") {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || "/icons/icon-192.png",
        badge: payload.badge || "/icons/icon-192.png",
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
        data: payload
      });

      notification.onclick = () => {
        window.focus();
        if (payload.url) {
          window.location.href = payload.url;
        }
        notification.close();
      };
    }
  }

  // Calculate retry delay with exponential backoff
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 60000; // 1 minute
    const maxDelay = 3600000; // 1 hour

    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  // Get last user activity timestamp
  private getLastUserActivity(): number {
    const lastActivity = localStorage.getItem("lastUserActivity");
    return lastActivity ? parseInt(lastActivity) : 0;
  }

  // Update user activity timestamp
  private updateUserActivity() {
    localStorage.setItem("lastUserActivity", Date.now().toString());
  }

  // Generate unique ID
  private generateId(): string {
    return `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save to localStorage
  private saveToStorage() {
    try {
      const notifications = Array.from(this.scheduledNotifications.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error("Failed to save scheduled notifications:", error);
    }
  }

  // Load from localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const notifications: ScheduledNotification[] = JSON.parse(stored);

        // Only load pending notifications that haven't expired
        const validNotifications = notifications.filter(n =>
          n.status === "pending" &&
          n.scheduledTime > Date.now() - (24 * 60 * 60 * 1000) // Not older than 24 hours
        );

        for (const notification of validNotifications) {
          this.scheduledNotifications.set(notification.id, notification);
        }

        console.log(`Loaded ${validNotifications.length} scheduled notifications`);
      }
    } catch (error) {
      console.error("Failed to load scheduled notifications:", error);
    }
  }

  // Clean up old notifications
  cleanup(): number {
    let cleanedCount = 0;
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const [id, notification] of this.scheduledNotifications) {
      if (notification.status === "delivered" || notification.status === "cancelled" || notification.status === "failed") {
        if (notification.deliveredAt && notification.deliveredAt < oneWeekAgo) {
          this.scheduledNotifications.delete(id);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      this.saveToStorage();
      console.log(`Cleaned up ${cleanedCount} old notifications`);
    }

    return cleanedCount;
  }

  // Get statistics
  getStats() {
    const notifications = Array.from(this.scheduledNotifications.values());
    const stats = {
      total: notifications.length,
      pending: notifications.filter(n => n.status === "pending").length,
      delivered: notifications.filter(n => n.status === "delivered").length,
      cancelled: notifications.filter(n => n.status === "cancelled").length,
      failed: notifications.filter(n => n.status === "failed").length
    };

    return stats;
  }
}

// React hook for using the notification scheduler
export function useNotificationScheduler() {
  const scheduler = NotificationScheduler.getInstance();

  const scheduleNow = (payload: PushNotificationPayload, userId: string, options?: Partial<ScheduleOptions>) => {
    return scheduler.scheduleNow(payload, userId, options);
  };

  const scheduleWithDelay = (payload: PushNotificationPayload, userId: string, delayMs: number, options?: Partial<ScheduleOptions>) => {
    return scheduler.scheduleWithDelay(payload, userId, delayMs, options);
  };

  const scheduleAtTime = (payload: PushNotificationPayload, userId: string, specificTime: Date, options?: Partial<ScheduleOptions>) => {
    return scheduler.scheduleAtTime(payload, userId, specificTime, options);
  };

  const scheduleRecurring = (payload: PushNotificationPayload, userId: string, intervalMs: number, options: ScheduleOptions) => {
    return scheduler.scheduleRecurring(payload, userId, intervalMs, options);
  };

  const cancel = (notificationId: string) => {
    return scheduler.cancel(notificationId);
  };

  const cancelAllForUser = (userId: string) => {
    return scheduler.cancelAllForUser(userId);
  };

  const getScheduledForUser = (userId: string, status?: string) => {
    return scheduler.getScheduledForUser(userId, status);
  };

  const cleanup = () => {
    return scheduler.cleanup();
  };

  const getStats = () => {
    return scheduler.getStats();
  };

  return {
    scheduleNow,
    scheduleWithDelay,
    scheduleAtTime,
    scheduleRecurring,
    cancel,
    cancelAllForUser,
    getScheduledForUser,
    cleanup,
    getStats
  };
}

// Initialize user activity tracking
if (typeof window !== 'undefined') {
  // Track user activity
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, () => {
      NotificationScheduler.getInstance();
    }, { passive: true });
  });
}

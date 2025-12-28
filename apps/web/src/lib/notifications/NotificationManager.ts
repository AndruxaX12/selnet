"use client";

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type NotificationPermission = 'default' | 'granted' | 'denied';

class NotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey = 'your-vapid-public-key'; // Replace with actual VAPID key

  constructor() {
    this.initializeServiceWorker();
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready;
        console.log('Service Worker ready for notifications');
      } catch (error) {
        console.error('Service Worker initialization failed:', error);
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    
    return permission as NotificationPermission;
  }

  // Get current permission status
  getPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission as NotificationPermission;
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service Worker not ready');
      return null;
    }

    try {
      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
        
        console.log('New push subscription created');
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        console.log('Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Show local notification
  async showNotification(options: NotificationOptions): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if (!this.registration) {
      // Fallback to browser notification
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192.png',
        badge: options.badge || '/icons/icon-192.png',
        image: options.image,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
        vibrate: options.vibrate || [200, 100, 200],
        timestamp: options.timestamp || Date.now()
      });
      return;
    }

    // Use Service Worker notification
    await this.registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/icons/icon-192.png',
      badge: options.badge || '/icons/icon-192.png',
      image: options.image,
      tag: options.tag || `notification-${Date.now()}`,
      data: options.data,
      actions: options.actions,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      vibrate: options.vibrate || [200, 100, 200],
      timestamp: options.timestamp || Date.now()
    });
  }

  // Get active notifications
  async getNotifications(tag?: string): Promise<Notification[]> {
    if (!this.registration) {
      return [];
    }

    const notifications = await this.registration.getNotifications({ tag });
    return notifications;
  }

  // Close notification by tag
  async closeNotification(tag: string): Promise<void> {
    const notifications = await this.getNotifications(tag);
    notifications.forEach(notification => notification.close());
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Predefined notification types
  async showSignalNotification(signal: any): Promise<void> {
    await this.showNotification({
      title: 'Нов сигнал в района',
      body: signal.title || 'Получен е нов сигнал за проблем',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `signal-${signal.id}`,
      data: {
        type: 'signal',
        id: signal.id,
        url: `/signals/${signal.id}`
      },
      actions: [
        {
          action: 'view',
          title: 'Виж сигнала',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Затвори',
          icon: '/icons/close.png'
        }
      ],
      vibrate: [200, 100, 200, 100, 200]
    });
  }

  async showEventNotification(event: any): Promise<void> {
    await this.showNotification({
      title: 'Предстоящо събитие',
      body: event.title || 'Има предстоящо събитие в района',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `event-${event.id}`,
      data: {
        type: 'event',
        id: event.id,
        url: `/events/${event.id}`
      },
      actions: [
        {
          action: 'view',
          title: 'Виж събитието',
          icon: '/icons/view.png'
        },
        {
          action: 'remind',
          title: 'Напомни ми',
          icon: '/icons/remind.png'
        }
      ],
      vibrate: [100, 50, 100]
    });
  }

  async showUpdateNotification(): Promise<void> {
    await this.showNotification({
      title: 'СелНет е обновен',
      body: 'Налична е нова версия на приложението',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'app-update',
      data: {
        type: 'update',
        url: '/'
      },
      actions: [
        {
          action: 'reload',
          title: 'Презареди',
          icon: '/icons/reload.png'
        },
        {
          action: 'later',
          title: 'По-късно',
          icon: '/icons/later.png'
        }
      ],
      requireInteraction: true,
      vibrate: [300, 100, 300]
    });
  }

  // Check if push notifications are supported
  get isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  // Get subscription status
  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    subscription: PushSubscription | null;
  }> {
    if (!this.registration) {
      return { isSubscribed: false, subscription: null };
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      return {
        isSubscribed: !!subscription,
        subscription
      };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { isSubscribed: false, subscription: null };
    }
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();

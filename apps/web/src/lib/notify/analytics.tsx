import { collection, doc, getDoc, setDoc, updateDoc, increment, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect, useCallback } from "react";

const db = getFirestore(app);

// Analytics event types
export type NotificationEventType =
  | "sent"
  | "delivered"
  | "displayed"
  | "clicked"
  | "dismissed"
  | "action_taken"
  | "failed"
  | "expired";

// Analytics interfaces
export interface NotificationAnalyticsEvent {
  id: string;
  userId: string;
  notificationId: string;
  eventType: NotificationEventType;
  timestamp: number;
  metadata: {
    channel?: string;
    priority?: string;
    deviceType?: string;
    deliveryMethod?: "push" | "in-app" | "email";
    userAgent?: string;
    viewportSize?: string;
    timeOfDay?: string;
    dayOfWeek?: string;
  };
  sessionData?: {
    sessionDuration?: number;
    pageViews?: number;
    lastActivity?: number;
  };
}

export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalDismissed: number;
  totalFailed: number;
  openRate: number;
  clickRate: number;
  dismissRate: number;
  averageTimeToOpen: number;
  averageTimeToDismiss: number;
  channelStats: Record<string, ChannelStats>;
  timeBasedStats: TimeBasedStats;
  deviceStats: DeviceStats;
  engagementScore: number;
}

export interface ChannelStats {
  sent: number;
  delivered: number;
  opened: number;
  dismissed: number;
  openRate: number;
  avgResponseTime: number;
}

export interface TimeBasedStats {
  hourly: Record<string, number>;
  daily: Record<string, number>;
  weekly: Record<string, number>;
  bestTimes: string[];
  worstTimes: string[];
}

export interface DeviceStats {
  mobile: { sent: number; opened: number; openRate: number };
  desktop: { sent: number; opened: number; openRate: number };
  tablet: { sent: number; opened: number; openRate: number };
}

export interface UserEngagementMetrics {
  totalNotifications: number;
  openedNotifications: number;
  dismissedNotifications: number;
  averageResponseTime: number;
  preferredChannels: string[];
  preferredTimes: string[];
  engagementScore: number;
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

// Analytics Manager Class
export class NotificationAnalyticsManager {
  private static instance: NotificationAnalyticsManager;
  private readonly COLLECTION_NAME = "notificationAnalytics";

  private constructor() {}

  static getInstance(): NotificationAnalyticsManager {
    if (!NotificationAnalyticsManager.instance) {
      NotificationAnalyticsManager.instance = new NotificationAnalyticsManager();
    }
    return NotificationAnalyticsManager.instance;
  }

  // Track a notification event
  async trackEvent(eventData: Omit<NotificationAnalyticsEvent, "id" | "timestamp">): Promise<void> {
    try {
      const event: NotificationAnalyticsEvent = {
        ...eventData,
        id: this.generateEventId(),
        timestamp: Date.now()
      };

      // Add to Firestore
      const eventRef = doc(collection(db, this.COLLECTION_NAME));
      await setDoc(eventRef, event);

      // Update user analytics
      await this.updateUserAnalytics(event.userId, event);

      // Update global analytics
      await this.updateGlobalAnalytics(event);

      console.log(`Analytics event tracked: ${event.eventType} for notification ${event.notificationId}`);
    } catch (error) {
      console.error("Failed to track analytics event:", error);
    }
  }

  // Get user analytics
  async getUserAnalytics(userId: string): Promise<UserEngagementMetrics | null> {
    try {
      const userDoc = await getDoc(doc(db, "userAnalytics", userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserEngagementMetrics;
      }
      return null;
    } catch (error) {
      console.error("Failed to get user analytics:", error);
      return null;
    }
  }

  // Get global analytics
  async getGlobalAnalytics(): Promise<NotificationAnalytics | null> {
    try {
      const globalDoc = await getDoc(doc(db, "globalAnalytics", "overview"));
      if (globalDoc.exists()) {
        return globalDoc.data() as NotificationAnalytics;
      }
      return null;
    } catch (error) {
      console.error("Failed to get global analytics:", error);
      return null;
    }
  }

  // Update user analytics
  private async updateUserAnalytics(userId: string, event: NotificationAnalyticsEvent): Promise<void> {
    try {
      const userRef = doc(db, "userAnalytics", userId);
      const userDoc = await getDoc(userRef);

      const userData = userDoc.exists() ? userDoc.data() as UserEngagementMetrics : this.createDefaultUserAnalytics();

      // Update metrics based on event type
      switch (event.eventType) {
        case "sent":
          userData.totalNotifications++;
          break;
        case "displayed":
        case "delivered":
          userData.openedNotifications++;
          break;
        case "dismissed":
          userData.dismissedNotifications++;
          break;
      }

      // Update engagement score
      userData.engagementScore = this.calculateEngagementScore(userData);

      // Update trends
      userData.trends = this.updateTrends(userData.trends, event);

      await setDoc(userRef, userData, { merge: true });
    } catch (error) {
      console.error("Failed to update user analytics:", error);
    }
  }

  // Update global analytics
  private async updateGlobalAnalytics(event: NotificationAnalyticsEvent): Promise<void> {
    try {
      const globalRef = doc(db, "globalAnalytics", "overview");
      const globalDoc = await getDoc(globalRef);

      const globalData = globalDoc.exists() ? globalDoc.data() as NotificationAnalytics : this.createDefaultGlobalAnalytics();

      // Update counts
      switch (event.eventType) {
        case "sent":
          globalData.totalSent++;
          break;
        case "delivered":
          globalData.totalDelivered++;
          break;
        case "displayed":
          globalData.totalOpened++;
          break;
        case "dismissed":
          globalData.totalDismissed++;
          break;
        case "failed":
          globalData.totalFailed++;
          break;
      }

      // Calculate rates
      globalData.openRate = globalData.totalSent > 0 ? (globalData.totalOpened / globalData.totalSent) * 100 : 0;
      globalData.clickRate = globalData.totalDelivered > 0 ? (globalData.totalOpened / globalData.totalDelivered) * 100 : 0;
      globalData.dismissRate = globalData.totalSent > 0 ? (globalData.totalDismissed / globalData.totalSent) * 100 : 0;

      // Update channel stats
      if (event.metadata.channel) {
        if (!globalData.channelStats[event.metadata.channel]) {
          globalData.channelStats[event.metadata.channel] = {
            sent: 0,
            delivered: 0,
            opened: 0,
            dismissed: 0,
            openRate: 0,
            avgResponseTime: 0
          };
        }

        const channel = globalData.channelStats[event.metadata.channel];
        channel.sent++;
        if (event.eventType === "delivered") channel.delivered++;
        if (event.eventType === "displayed") channel.opened++;
        if (event.eventType === "dismissed") channel.dismissed++;

        channel.openRate = channel.sent > 0 ? (channel.opened / channel.sent) * 100 : 0;
      }

      // Update device stats
      if (event.metadata.deviceType) {
        const device = globalData.deviceStats[event.metadata.deviceType as keyof DeviceStats];
        if (device) {
          device.sent++;
          if (event.eventType === "displayed") device.opened++;
          device.openRate = device.sent > 0 ? (device.opened / device.sent) * 100 : 0;
        }
      }

      // Update time-based stats
      const hour = new Date(event.timestamp).getHours().toString();
      const day = new Date(event.timestamp).getDay().toString();

      if (!globalData.timeBasedStats.hourly[hour]) globalData.timeBasedStats.hourly[hour] = 0;
      if (!globalData.timeBasedStats.daily[day]) globalData.timeBasedStats.daily[day] = 0;

      globalData.timeBasedStats.hourly[hour]++;
      globalData.timeBasedStats.daily[day]++;

      // Calculate best/worst times
      globalData.timeBasedStats.bestTimes = this.calculateBestTimes(globalData.timeBasedStats.hourly);
      globalData.timeBasedStats.worstTimes = this.calculateWorstTimes(globalData.timeBasedStats.hourly);

      // Update engagement score
      globalData.engagementScore = this.calculateGlobalEngagementScore(globalData);

      await setDoc(globalRef, globalData, { merge: true });
    } catch (error) {
      console.error("Failed to update global analytics:", error);
    }
  }

  // Helper methods
  private generateEventId(): string {
    return `analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createDefaultUserAnalytics(): UserEngagementMetrics {
    return {
      totalNotifications: 0,
      openedNotifications: 0,
      dismissedNotifications: 0,
      averageResponseTime: 0,
      preferredChannels: [],
      preferredTimes: [],
      engagementScore: 0,
      trends: {
        daily: [],
        weekly: [],
        monthly: []
      }
    };
  }

  private createDefaultGlobalAnalytics(): NotificationAnalytics {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalDismissed: 0,
      totalFailed: 0,
      openRate: 0,
      clickRate: 0,
      dismissRate: 0,
      averageTimeToOpen: 0,
      averageTimeToDismiss: 0,
      channelStats: {},
      timeBasedStats: {
        hourly: {},
        daily: {},
        weekly: {},
        bestTimes: [],
        worstTimes: []
      },
      deviceStats: {
        mobile: { sent: 0, opened: 0, openRate: 0 },
        desktop: { sent: 0, opened: 0, openRate: 0 },
        tablet: { sent: 0, opened: 0, openRate: 0 }
      },
      engagementScore: 0
    };
  }

  private calculateEngagementScore(userData: UserEngagementMetrics): number {
    if (userData.totalNotifications === 0) return 0;

    const openRate = userData.openedNotifications / userData.totalNotifications;
    const dismissRate = userData.dismissedNotifications / userData.totalNotifications;
    const responseTimeScore = Math.max(0, 1 - (userData.averageResponseTime / 3600000)); // Hours

    return (openRate * 0.4 + (1 - dismissRate) * 0.4 + responseTimeScore * 0.2) * 100;
  }

  private calculateGlobalEngagementScore(globalData: NotificationAnalytics): number {
    const openRate = globalData.openRate / 100;
    const clickRate = globalData.clickRate / 100;
    const dismissRate = globalData.dismissRate / 100;

    return (openRate * 0.4 + clickRate * 0.4 + (1 - dismissRate) * 0.2) * 100;
  }

  private updateTrends(trends: UserEngagementMetrics["trends"], event: NotificationAnalyticsEvent): UserEngagementMetrics["trends"] {
    const now = new Date();
    const dayKey = now.toISOString().split('T')[0];
    const weekKey = this.getWeekKey(now);
    const monthKey = now.toISOString().slice(0, 7);

    // Update daily trend
    if (!trends.daily.includes(dayKey)) {
      trends.daily.push(dayKey);
      if (trends.daily.length > 30) trends.daily.shift(); // Keep last 30 days
    }

    // Update weekly trend
    if (!trends.weekly.includes(weekKey)) {
      trends.weekly.push(weekKey);
      if (trends.weekly.length > 12) trends.weekly.shift(); // Keep last 12 weeks
    }

    // Update monthly trend
    if (!trends.monthly.includes(monthKey)) {
      trends.monthly.push(monthKey);
      if (trends.monthly.length > 12) trends.monthly.shift(); // Keep last 12 months
    }

    return trends;
  }

  private calculateBestTimes(hourlyStats: Record<string, number>): string[] {
    const sorted = Object.entries(hourlyStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return sorted;
  }

  private calculateWorstTimes(hourlyStats: Record<string, number>): string[] {
    const sorted = Object.entries(hourlyStats)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return sorted;
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}

// React hook for analytics
export function useNotificationAnalytics() {
  const { user } = useAuth();
  const [userAnalytics, setUserAnalytics] = useState<UserEngagementMetrics | null>(null);
  const [globalAnalytics, setGlobalAnalytics] = useState<NotificationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const analyticsManager = NotificationAnalyticsManager.getInstance();

  const loadAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [userData, globalData] = await Promise.all([
        analyticsManager.getUserAnalytics(user.uid),
        analyticsManager.getGlobalAnalytics()
      ]);

      setUserAnalytics(userData);
      setGlobalAnalytics(globalData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [user, analyticsManager]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const trackEvent = useCallback(async (eventData: Omit<NotificationAnalyticsEvent, "id" | "timestamp" | "userId">) => {
    if (!user) return;

    await analyticsManager.trackEvent({
      ...eventData,
      userId: user.uid
    });
  }, [user, analyticsManager]);

  return {
    userAnalytics,
    globalAnalytics,
    loading,
    trackEvent,
    refreshAnalytics: loadAnalytics
  };
}

// Analytics dashboard component
export function NotificationAnalyticsDashboard() {
  const { userAnalytics, globalAnalytics, loading } = useNotificationAnalytics();

  if (loading) {
    return <div className="flex justify-center p-8">Зареждане на аналитика...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Аналитика на известията</h2>

        {userAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">Общо известия</h3>
              <p className="text-2xl font-bold text-blue-600">{userAnalytics.totalNotifications}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900">Отворени</h3>
              <p className="text-2xl font-bold text-green-600">{userAnalytics.openedNotifications}</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900">Отхвърлени</h3>
              <p className="text-2xl font-bold text-yellow-600">{userAnalytics.dismissedNotifications}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900">Engagement Score</h3>
              <p className="text-2xl font-bold text-purple-600">{userAnalytics.engagementScore.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {globalAnalytics && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Глобална статистика</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Open Rate</p>
                <p className="text-xl font-bold text-blue-600">{globalAnalytics.openRate.toFixed(1)}%</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">Click Rate</p>
                <p className="text-xl font-bold text-green-600">{globalAnalytics.clickRate.toFixed(1)}%</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">Dismiss Rate</p>
                <p className="text-xl font-bold text-red-600">{globalAnalytics.dismissRate.toFixed(1)}%</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">Engagement</p>
                <p className="text-xl font-bold text-purple-600">{globalAnalytics.engagementScore.toFixed(1)}%</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Най-добри часове</h4>
              <div className="flex flex-wrap gap-2">
                {globalAnalytics.timeBasedStats.bestTimes.map((time, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {time}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

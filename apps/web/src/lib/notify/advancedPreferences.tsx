"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getFirestore } from "firebase/firestore";

// Advanced notification preferences interface
export interface AdvancedNotificationPreferences {
  // Basic settings
  enabled: boolean;
  soundEnabled: boolean;
  showPreviews: boolean;

  // Time-based settings
  timeWindows: TimeWindow[];
  quietHours: QuietHours;
  timezone: string;

  // Channel-specific settings
  channelSettings: {
    signals: ChannelPreferences;
    ideas: ChannelPreferences;
    events: ChannelPreferences;
    system: ChannelPreferences;
  };

  // Priority settings
  priorityFilters: PriorityFilter[];
  defaultPriority: "low" | "normal" | "high" | "urgent";

  // Device-specific settings
  deviceSettings: {
    mobile: DevicePreferences;
    desktop: DevicePreferences;
    tablet: DevicePreferences;
  };

  // Advanced features
  smartNotifications: SmartNotificationSettings;
  doNotDisturb: DoNotDisturbSettings;

  // Analytics and feedback
  analytics: {
    enabled: boolean;
    trackOpens: boolean;
    trackDismissals: boolean;
  };
}

export interface TimeWindow {
  id: string;
  name: string;
  enabled: boolean;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  allowedChannels: string[];
  priority: "low" | "normal" | "high" | "urgent";
}

export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  allowUrgent: boolean;
  allowChannels: string[];
}

export interface ChannelPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreviews: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  filters: NotificationFilter[];
}

export interface NotificationFilter {
  type: "keyword" | "sender" | "priority" | "custom";
  operator: "contains" | "equals" | "not_contains" | "not_equals" | "regex";
  value: string;
  action: "allow" | "block" | "downgrade" | "upgrade";
}

export interface PriorityFilter {
  condition: {
    type: "time" | "location" | "activity" | "custom";
    value: any;
  };
  action: {
    type: "set_priority" | "delay" | "block" | "redirect";
    value: any;
  };
}

export interface DevicePreferences {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreviews: boolean;
  maxNotificationsPerHour: number;
  groupNotifications: boolean;
}

export interface SmartNotificationSettings {
  enabled: boolean;
  groupSimilar: boolean;
  delayRepeated: boolean;
  learnFromBehavior: boolean;
  adaptiveTiming: boolean;
  maxPerDay: number;
}

export interface DoNotDisturbSettings {
  enabled: boolean;
  mode: "manual" | "automatic" | "scheduled";
  allowUrgent: boolean;
  allowChannels: string[];
  autoEnableDuring: {
    meetings: boolean;
    focusTime: boolean;
    sleeping: boolean;
  };
}

const defaultPreferences: AdvancedNotificationPreferences = {
  enabled: true,
  soundEnabled: true,
  showPreviews: true,
  timeWindows: [],
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
    allowUrgent: true,
    allowChannels: ["system"]
  },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  channelSettings: {
    signals: {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      showPreviews: true,
      priority: "normal",
      filters: []
    },
    ideas: {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      showPreviews: true,
      priority: "normal",
      filters: []
    },
    events: {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      showPreviews: true,
      priority: "normal",
      filters: []
    },
    system: {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      showPreviews: true,
      priority: "normal",
      filters: []
    }
  },
  priorityFilters: [],
  defaultPriority: "normal",
  deviceSettings: {
    mobile: {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      showPreviews: true,
      maxNotificationsPerHour: 10,
      groupNotifications: true
    },
    desktop: {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: false,
      showPreviews: true,
      maxNotificationsPerHour: 20,
      groupNotifications: false
    },
    tablet: {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      showPreviews: true,
      maxNotificationsPerHour: 15,
      groupNotifications: true
    }
  },
  smartNotifications: {
    enabled: true,
    groupSimilar: true,
    delayRepeated: true,
    learnFromBehavior: false,
    adaptiveTiming: false,
    maxPerDay: 50
  },
  doNotDisturb: {
    enabled: false,
    mode: "manual",
    allowUrgent: true,
    allowChannels: ["system"],
    autoEnableDuring: {
      meetings: false,
      focusTime: false,
      sleeping: false
    }
  },
  analytics: {
    enabled: true,
    trackOpens: true,
    trackDismissals: true
  }
};

export function useAdvancedNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AdvancedNotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const db = getFirestore(app);

  // Load preferences from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadPreferences();
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (userData?.notificationPreferences) {
        setPreferences({
          ...defaultPreferences,
          ...userData.notificationPreferences
        });
      } else {
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  }, [user, db]);

  // Save preferences to Firestore
  const savePreferences = useCallback(async (newPreferences: AdvancedNotificationPreferences) => {
    if (!user) return false;

    try {
      setSaving(true);
      await updateDoc(doc(db, "users", user.uid), {
        notificationPreferences: newPreferences,
        updatedAt: Date.now()
      });

      setPreferences(newPreferences);
      return true;
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, db]);

  // Update specific preference
  const updatePreference = useCallback(async (updates: Partial<AdvancedNotificationPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    return await savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Add time window
  const addTimeWindow = useCallback(async (timeWindow: Omit<TimeWindow, "id">) => {
    const newWindow: TimeWindow = {
      ...timeWindow,
      id: `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const newPreferences = {
      ...preferences,
      timeWindows: [...preferences.timeWindows, newWindow]
    };

    return await savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Update time window
  const updateTimeWindow = useCallback(async (windowId: string, updates: Partial<TimeWindow>) => {
    const newPreferences = {
      ...preferences,
      timeWindows: preferences.timeWindows.map(window =>
        window.id === windowId ? { ...window, ...updates } : window
      )
    };

    return await savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Remove time window
  const removeTimeWindow = useCallback(async (windowId: string) => {
    const newPreferences = {
      ...preferences,
      timeWindows: preferences.timeWindows.filter(window => window.id !== windowId)
    };

    return await savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Update channel settings
  const updateChannelSettings = useCallback(async (channel: keyof AdvancedNotificationPreferences["channelSettings"], settings: ChannelPreferences) => {
    const newPreferences = {
      ...preferences,
      channelSettings: {
        ...preferences.channelSettings,
        [channel]: settings
      }
    };

    return await savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Check if notification should be allowed based on current preferences
  const shouldAllowNotification = useCallback((payload: any): { allowed: boolean; reason?: string; modifiedPayload?: any } => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    const currentDay = now.getDay();

    // Check if notifications are enabled
    if (!preferences.enabled) {
      return { allowed: false, reason: "Notifications disabled" };
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const isInQuietHours = isTimeInRange(currentTime, preferences.quietHours.startTime, preferences.quietHours.endTime);
      if (isInQuietHours) {
        if (!preferences.quietHours.allowUrgent && payload.priority === "urgent") {
          return { allowed: false, reason: "Quiet hours active" };
        }
        if (!preferences.quietHours.allowChannels.includes(payload.channel)) {
          return { allowed: false, reason: "Channel not allowed during quiet hours" };
        }
      }
    }

    // Check time windows
    const activeWindow = preferences.timeWindows.find(window =>
      window.enabled &&
      window.daysOfWeek.includes(currentDay) &&
      isTimeInRange(currentTime, window.startTime, window.endTime) &&
      window.allowedChannels.includes(payload.channel)
    );

    if (activeWindow) {
      // Modify priority if specified in time window
      if (activeWindow.priority !== payload.priority) {
        return {
          allowed: true,
          reason: "Modified by time window",
          modifiedPayload: { ...payload, priority: activeWindow.priority }
        };
      }
    }

    // Check channel settings
    const channelSettings = preferences.channelSettings[payload.channel as keyof AdvancedNotificationPreferences["channelSettings"]];
    if (channelSettings && !channelSettings.enabled) {
      return { allowed: false, reason: "Channel disabled" };
    }

    // Check filters
    if (channelSettings?.filters) {
      for (const filter of channelSettings.filters) {
        if (!passesFilter(payload, filter)) {
          return { allowed: false, reason: `Blocked by filter: ${filter.type}` };
        }
      }
    }

    // Check device limits
    const deviceType = getDeviceType();
    const deviceSettings = preferences.deviceSettings[deviceType];
    if (deviceSettings) {
      // Check daily limit
      const todayNotifications = getTodayNotificationCount();
      if (todayNotifications >= deviceSettings.maxNotificationsPerHour) {
        return { allowed: false, reason: "Daily limit reached" };
      }
    }

    return { allowed: true };
  }, [preferences]);

  // Get current device type
  const getDeviceType = useCallback((): "mobile" | "desktop" | "tablet" => {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;
    if (width <= 768) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
  }, []);

  // Get today's notification count (simplified)
  const getTodayNotificationCount = useCallback(() => {
    // In a real implementation, this would track actual notifications
    return 0;
  }, []);

  return {
    preferences,
    loading,
    saving,
    updatePreference,
    savePreferences,
    addTimeWindow,
    updateTimeWindow,
    removeTimeWindow,
    updateChannelSettings,
    shouldAllowNotification,
    loadPreferences
  };
}

// Utility functions
function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeNum = timeToMinutes(time);
  const startNum = timeToMinutes(start);
  const endNum = timeToMinutes(end);

  if (startNum <= endNum) {
    return timeNum >= startNum && timeNum <= endNum;
  } else {
    // Handle overnight ranges
    return timeNum >= startNum || timeNum <= endNum;
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function passesFilter(payload: any, filter: NotificationFilter): boolean {
  let fieldValue: string;

  switch (filter.type) {
    case "keyword":
      fieldValue = (payload.title + " " + (payload.body || "")).toLowerCase();
      break;
    case "sender":
      fieldValue = payload.sender || "";
      break;
    case "priority":
      fieldValue = payload.priority || "normal";
      break;
    default:
      return true; // Unknown filter type passes by default
  }

  const filterValue = filter.value.toLowerCase();

  switch (filter.operator) {
    case "contains":
      return fieldValue.includes(filterValue);
    case "equals":
      return fieldValue === filterValue;
    case "not_contains":
      return !fieldValue.includes(filterValue);
    case "not_equals":
      return fieldValue !== filterValue;
    case "regex":
      try {
        return new RegExp(filterValue).test(fieldValue);
      } catch {
        return false;
      }
    default:
      return true;
  }
}

// React component for advanced preferences UI
export function AdvancedNotificationPreferencesComponent() {
  const { preferences, loading, saving, updatePreference, addTimeWindow } = useAdvancedNotificationPreferences();
  const [activeTab, setActiveTab] = useState("general");

  if (loading) {
    return <div className="flex justify-center p-8">Зареждане...</div>;
  }

  const tabs = [
    { id: "general", name: "Общи", icon: "⚙️" },
    { id: "channels", name: "Канали", icon: "📢" },
    { id: "schedule", name: "График", icon: "🕐" },
    { id: "smart", name: "Умни", icon: "🧠" },
    { id: "devices", name: "Устройства", icon: "📱" }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "general" && <GeneralSettingsTab preferences={preferences} updatePreference={updatePreference} />}
          {activeTab === "channels" && <ChannelSettingsTab preferences={preferences} updatePreference={updatePreference} />}
          {activeTab === "schedule" && <ScheduleSettingsTab preferences={preferences} updatePreference={updatePreference} addTimeWindow={addTimeWindow} />}
          {activeTab === "smart" && <SmartSettingsTab preferences={preferences} updatePreference={updatePreference} />}
          {activeTab === "devices" && <DeviceSettingsTab preferences={preferences} updatePreference={updatePreference} />}
        </div>
      </div>
    </div>
  );
}

// Individual tab components would be implemented here
function GeneralSettingsTab({ preferences, updatePreference }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Общи настройки</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900">Известия</span>
            <p className="text-sm text-gray-600">Разреши всички известия</p>
          </div>
          <button
            aria-label="Включи известия"
            onClick={() => updatePreference({ enabled: !preferences.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.enabled ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.enabled ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900">Звук</span>
            <p className="text-sm text-gray-600">Възпроизвеждане на звук</p>
          </div>
          <button
            aria-label="Включи звук"
            onClick={() => updatePreference({ soundEnabled: !preferences.soundEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.soundEnabled ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.soundEnabled ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900">Прегледи</span>
            <p className="text-sm text-gray-600">Показване на съдържание в заключения екран</p>
          </div>
          <button
            aria-label="Показвай прегледи"
            onClick={() => updatePreference({ showPreviews: !preferences.showPreviews })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.showPreviews ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.showPreviews ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function ChannelSettingsTab({ preferences, updatePreference }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Настройки по канали</h3>
      <div className="text-center py-8 text-gray-500">
        Каналните настройки ще бъдат имплементирани в следващата версия
      </div>
    </div>
  );
}

function ScheduleSettingsTab({ preferences, updatePreference, addTimeWindow }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">График и времеви прозорци</h3>
      <div className="text-center py-8 text-gray-500">
        Графикът ще бъде имплементиран в следващата версия
      </div>
    </div>
  );
}

function SmartSettingsTab({ preferences, updatePreference }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Умни известия</h3>
      <div className="text-center py-8 text-gray-500">
        Умните настройки ще бъдат имплементирани в следващата версия
      </div>
    </div>
  );
}

function DeviceSettingsTab({ preferences, updatePreference }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Настройки по устройства</h3>
      <div className="text-center py-8 text-gray-500">
        Устройствените настройки ще бъдат имплементирани в следващата версия
      </div>
    </div>
  );
}

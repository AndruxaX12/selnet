import { useState, useEffect } from "react";
import { UserSettings, SubscriptionSettings } from "@/types/profile";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) {
        throw new Error("No token found");
      }

      // Load general settings
      const settingsRes = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!settingsRes.ok) {
        throw new Error("Failed to load settings");
      }

      const settingsData = await settingsRes.json();
      setSettings(settingsData);

      // Load subscriptions
      const subsRes = await fetch("/api/settings/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscriptions(subsData);
      }
    } catch (err: any) {
      setError(err.message);
      setSettings(null);
      setSubscriptions(null);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (data: Partial<UserSettings>) => {
    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch("/api/settings/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      await loadSettings();
      return true;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateSubscriptions = async (data: Partial<SubscriptionSettings>) => {
    try {
      const token = localStorage.getItem("token") || 
                     localStorage.getItem("idToken") || 
                     localStorage.getItem("firebaseToken");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch("/api/settings/subscriptions/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update subscriptions");
      }

      await loadSettings();
      return true;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    subscriptions,
    loading,
    error,
    reload: loadSettings,
    updateSettings,
    updateSubscriptions,
  };
}

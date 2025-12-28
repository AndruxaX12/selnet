/**
 * User Profile interfaces
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  phoneNumber: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  createdAt: string;
  signalsCount: number;
  
  // Location
  city: string;
  street: string;
  
  // Settings
  notificationsEnabled: boolean;
  
  // Metadata
  lastSignInTime?: string;
}

export interface ProfileUpdateData {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  city?: string;
  street?: string;
}

export interface LocationUpdateData {
  city: string;
  street?: string;
  receiveCityAlerts?: boolean;
  receiveStreetAlerts?: boolean;
}

export interface PasswordUpdateData {
  newPassword: string;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  city: string;
  street: string;
  language: string;
  role: string;
  updatedAt: string | null;
}

export interface SettingsUpdateData {
  notificationsEnabled?: boolean;
  language?: string;
}

export interface SubscriptionSettings {
  city: string;
  street: string;
  receiveCityAlerts: boolean;
  receiveStreetAlerts: boolean;
}

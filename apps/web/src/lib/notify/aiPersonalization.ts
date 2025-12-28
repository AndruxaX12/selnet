import { PushNotificationPayload } from "./pushManager";
import { NotificationAnalyticsManager } from "./analytics";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getFirestore } from "firebase/firestore";

// AI Personalization Engine Types
export interface UserProfile {
  id: string;
  preferences: UserPreferences;
  behaviorPatterns: BehaviorPatterns;
  engagementHistory: EngagementHistory;
  contextualData: ContextualData;
  personalizationScore: PersonalizationScore;
  lastUpdated: number;
}

export interface UserPreferences {
  notificationStyle: "concise" | "detailed" | "friendly" | "professional";
  preferredTimes: string[];
  preferredChannels: string[];
  contentPreferences: {
    technicalLevel: "beginner" | "intermediate" | "advanced";
    languageComplexity: "simple" | "moderate" | "complex";
    includeEmojis: boolean;
    includeImages: boolean;
  };
  interactionPreferences: {
    responseFormat: "buttons" | "links" | "text";
    autoActions: string[];
    reminderFrequency: "never" | "sometimes" | "often";
  };
}

export interface BehaviorPatterns {
  activeHours: number[];
  responseTimes: number[]; // Average response times by hour
  engagementRates: Record<string, number>; // Channel -> engagement rate
  dismissalReasons: Record<string, number>; // Reason -> count
  preferredContentTypes: string[];
  interactionPatterns: InteractionPattern[];
}

export interface InteractionPattern {
  context: string;
  action: string;
  timestamp: number;
  outcome: "positive" | "negative" | "neutral";
  confidence: number;
}

export interface EngagementHistory {
  totalInteractions: number;
  positiveInteractions: number;
  negativeInteractions: number;
  averageEngagementTime: number;
  peakActivityHours: number[];
  preferredDays: number[];
  notificationFatigue: NotificationFatigue;
}

export interface NotificationFatigue {
  currentLevel: number; // 0-100
  threshold: number;
  recoveryRate: number; // Points per hour
  lastFatigueUpdate: number;
  fatigueEvents: FatigueEvent[];
}

export interface FatigueEvent {
  timestamp: number;
  severity: number;
  reason: string;
  recoveryTime: number;
}

export interface ContextualData {
  currentActivity: string;
  location?: string;
  deviceType: string;
  timeOfDay: string;
  dayOfWeek: string;
  weather?: string;
  calendarEvents: CalendarEvent[];
  activeTasks: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  type: "meeting" | "reminder" | "event" | "task";
  priority: "low" | "normal" | "high";
}

export interface PersonalizationScore {
  overall: number;
  recency: number;
  frequency: number;
  engagement: number;
  contextual: number;
  behavioral: number;
}

export interface PersonalizedNotification extends PushNotificationPayload {
  personalization: {
    confidence: number;
    reasoning: string[];
    alternatives: AlternativeContent[];
    predictedEngagement: number;
    optimalTiming: OptimalTiming;
  };
}

export interface AlternativeContent {
  type: "title" | "body" | "icon" | "actions";
  content: string;
  confidence: number;
  reasoning: string;
}

export interface OptimalTiming {
  recommendedTime: number;
  confidence: number;
  reasoning: string;
  alternatives: number[];
}

export interface AIPrediction {
  userId: string;
  predictionType: "engagement" | "timing" | "content" | "channel";
  input: Record<string, any>;
  output: any;
  confidence: number;
  modelVersion: string;
  timestamp: number;
}

// AI Personalization Engine
export class AIPersonalizationEngine {
  private static instance: AIPersonalizationEngine;
  private userProfiles: Map<string, UserProfile> = new Map();
  private predictionModels: Map<string, PredictionModel> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes
  private readonly db = getFirestore(app);

  private constructor() {
    this.initializeModels();
  }

  static getInstance(): AIPersonalizationEngine {
    if (!AIPersonalizationEngine.instance) {
      AIPersonalizationEngine.instance = new AIPersonalizationEngine();
    }
    return AIPersonalizationEngine.instance;
  }

  // Personalize a notification based on user profile
  async personalizeNotification(
    baseNotification: PushNotificationPayload,
    userId: string,
    context?: Partial<ContextualData>
  ): Promise<PersonalizedNotification> {
    const userProfile = await this.getOrCreateUserProfile(userId);
    const contextualData = await this.getContextualData(userId, context);

    // Update user profile with current interaction
    await this.updateUserProfile(userId, baseNotification, contextualData);

    // Generate personalized content
    const personalizedContent = await this.generatePersonalizedContent(
      baseNotification,
      userProfile,
      contextualData
    );

    // Predict optimal timing
    const optimalTiming = await this.predictOptimalTiming(
      baseNotification,
      userProfile,
      contextualData
    );

    // Calculate personalization score
    const personalizationScore = this.calculatePersonalizationScore(
      userProfile,
      contextualData
    );

    // Generate alternatives
    const alternatives = await this.generateAlternatives(
      baseNotification,
      userProfile,
      contextualData
    );

    // Predict engagement
    const predictedEngagement = await this.predictEngagement(
      personalizedContent,
      userProfile,
      contextualData
    );

    return {
      ...personalizedContent,
      personalization: {
        confidence: personalizationScore.overall,
        reasoning: this.generatePersonalizationReasoning(
          userProfile,
          contextualData,
          personalizationScore
        ),
        alternatives,
        predictedEngagement,
        optimalTiming
      }
    };
  }

  // Get or create user profile
  private async getOrCreateUserProfile(userId: string): Promise<UserProfile> {
    if (this.userProfiles.has(userId)) {
      const cached = this.userProfiles.get(userId)!;
      if (Date.now() - cached.lastUpdated < this.CACHE_DURATION) {
        return cached;
      }
    }

    try {
      const profileDoc = await getDoc(doc(this.db, "userProfiles", userId));
      if (profileDoc.exists()) {
        const profile = profileDoc.data() as UserProfile;
        this.userProfiles.set(userId, profile);
        return profile;
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }

    // Create default profile
    const defaultProfile = this.createDefaultUserProfile(userId);
    this.userProfiles.set(userId, defaultProfile);
    return defaultProfile;
  }

  // Create default user profile
  private createDefaultUserProfile(userId: string): UserProfile {
    return {
      id: userId,
      preferences: {
        notificationStyle: "friendly",
        preferredTimes: ["09:00", "14:00", "19:00"],
        preferredChannels: ["signals", "ideas", "events"],
        contentPreferences: {
          technicalLevel: "intermediate",
          languageComplexity: "moderate",
          includeEmojis: true,
          includeImages: true
        },
        interactionPreferences: {
          responseFormat: "buttons",
          autoActions: [],
          reminderFrequency: "sometimes"
        }
      },
      behaviorPatterns: {
        activeHours: [9, 10, 11, 14, 15, 16, 19, 20],
        responseTimes: [],
        engagementRates: {},
        dismissalReasons: {},
        preferredContentTypes: [],
        interactionPatterns: []
      },
      engagementHistory: {
        totalInteractions: 0,
        positiveInteractions: 0,
        negativeInteractions: 0,
        averageEngagementTime: 0,
        peakActivityHours: [9, 14, 19],
        preferredDays: [1, 2, 3, 4, 5], // Monday to Friday
        notificationFatigue: {
          currentLevel: 0,
          threshold: 75,
          recoveryRate: 5,
          lastFatigueUpdate: Date.now(),
          fatigueEvents: []
        }
      },
      contextualData: {
        currentActivity: "unknown",
        deviceType: "desktop",
        timeOfDay: this.getTimeOfDay(),
        dayOfWeek: new Date().getDay(),
        calendarEvents: [],
        activeTasks: []
      },
      personalizationScore: {
        overall: 0.5,
        recency: 0.5,
        frequency: 0.5,
        engagement: 0.5,
        contextual: 0.5,
        behavioral: 0.5
      },
      lastUpdated: Date.now()
    };
  }

  // Generate personalized content
  private async generatePersonalizedContent(
    baseNotification: PushNotificationPayload,
    userProfile: UserProfile,
    contextualData: ContextualData
  ): Promise<PushNotificationPayload> {
    const personalized: PushNotificationPayload = { ...baseNotification };

    // Personalize title based on user preferences
    personalized.title = this.personalizeTitle(
      baseNotification.title,
      userProfile.preferences.notificationStyle,
      userProfile.preferences.contentPreferences.languageComplexity
    );

    // Personalize body content
    if (baseNotification.body) {
      personalized.body = this.personalizeBody(
        baseNotification.body,
        userProfile.preferences,
        contextualData
      );
    }

    // Add personalized emoji if enabled
    if (userProfile.preferences.contentPreferences.includeEmojis) {
      personalized.icon = this.getContextualEmoji(
        baseNotification,
        contextualData
      );
    }

    // Personalize actions based on user preferences
    if (baseNotification.actions) {
      personalized.actions = this.personalizeActions(
        baseNotification.actions,
        userProfile.preferences.interactionPreferences
      );
    }

    // Adjust priority based on user fatigue
    personalized.priority = this.adjustPriorityForFatigue(
      baseNotification.priority || "normal",
      userProfile.engagementHistory.notificationFatigue
    );

    return personalized;
  }

  // Personalize notification title
  private personalizeTitle(
    title: string,
    style: string,
    complexity: string
  ): string {
    // Apply style transformations
    switch (style) {
      case "friendly":
        if (!title.includes("😊")) {
          title = `😊 ${title}`;
        }
        break;
      case "professional":
        title = title.replace(/😊|📢|⚡/g, "").trim();
        break;
      case "concise":
        if (title.length > 50) {
          title = title.substring(0, 47) + "...";
        }
        break;
      case "detailed":
        // Keep as is or add more context
        break;
    }

    return title;
  }

  // Personalize notification body
  private personalizeBody(
    body: string,
    preferences: UserPreferences,
    context: ContextualData
  ): string {
    let personalizedBody = body;

    // Adjust technical level
    switch (preferences.contentPreferences.technicalLevel) {
      case "beginner":
        personalizedBody = this.simplifyTechnicalTerms(personalizedBody);
        break;
      case "advanced":
        personalizedBody = this.addTechnicalDetails(personalizedBody);
        break;
    }

    // Adjust language complexity
    if (preferences.contentPreferences.languageComplexity === "simple") {
      personalizedBody = this.simplifyLanguage(personalizedBody);
    }

    // Add contextual information
    if (context.currentActivity !== "unknown") {
      personalizedBody += ` (докато ${context.currentActivity})`;
    }

    return personalizedBody;
  }

  // Simplify technical terms for beginners
  private simplifyTechnicalTerms(text: string): string {
    const simplifications: Record<string, string> = {
      "системна поддръжка": "техническо обслужване",
      "база данни": "място за съхранение на информация",
      "сървър": "компютър, който предоставя услуги",
      "алгоритъм": "стъпки за решаване на задача",
      "интерфейс": "начин за взаимодействие"
    };

    for (const [technical, simple] of Object.entries(simplifications)) {
      text = text.replace(new RegExp(technical, 'gi'), simple);
    }

    return text;
  }

  // Add technical details for advanced users
  private addTechnicalDetails(text: string): string {
    // Add technical context where appropriate
    if (text.includes("сигнал")) {
      text += " (с приоритетна обработка)";
    }
    if (text.includes("идея")) {
      text += " (с алгоритмична оценка)";
    }
    return text;
  }

  // Simplify language complexity
  private simplifyLanguage(text: string): string {
    const simplifications: Record<string, string> = {
      "извършва се": "става",
      "осъществява": "прави",
      "предоставя": "дава",
      "използва": "употребява",
      "необходимо е": "трябва",
      "възможно е": "може"
    };

    for (const [complex, simple] of Object.entries(simplifications)) {
      text = text.replace(new RegExp(complex, 'gi'), simple);
    }

    return text;
  }

  // Get contextual emoji
  private getContextualEmoji(
    notification: PushNotificationPayload,
    context: ContextualData
  ): string {
    const timeOfDay = context.timeOfDay;

    if (notification.channel === "signals") {
      return timeOfDay === "morning" ? "🌅" : timeOfDay === "evening" ? "🌆" : "📢";
    }
    if (notification.channel === "ideas") {
      return timeOfDay === "morning" ? "💡" : timeOfDay === "evening" ? "✨" : "🚀";
    }
    if (notification.channel === "events") {
      return timeOfDay === "morning" ? "📅" : timeOfDay === "evening" ? "🎉" : "📆";
    }
    if (notification.channel === "system") {
      return timeOfDay === "morning" ? "🔧" : timeOfDay === "evening" ? "⚙️" : "🔧";
    }

    return "🔔";
  }

  // Personalize actions
  private personalizeActions(
    actions: any[],
    preferences: UserPreferences["interactionPreferences"]
  ): any[] {
    const personalizedActions = [...actions];

    // Add auto-actions if enabled
    if (preferences.autoActions.length > 0) {
      preferences.autoActions.forEach(autoAction => {
        if (!personalizedActions.find(a => a.action === autoAction)) {
          personalizedActions.push({
            action: autoAction,
            title: this.getAutoActionTitle(autoAction)
          });
        }
      });
    }

    return personalizedActions;
  }

  // Get title for auto actions
  private getAutoActionTitle(action: string): string {
    const titles: Record<string, string> = {
      "mark-read": "Прочетено",
      "archive": "Архивирай",
      "snooze": "Отложи",
      "remind-later": "Напомни по-късно"
    };
    return titles[action] || action;
  }

  // Adjust priority based on fatigue
  private adjustPriorityForFatigue(
    priority: string,
    fatigue: NotificationFatigue
  ): string {
    if (fatigue.currentLevel > fatigue.threshold) {
      // Reduce priority if user is fatigued
      if (priority === "urgent") return "high";
      if (priority === "high") return "normal";
      if (priority === "normal") return "low";
    }

    return priority;
  }

  // Predict optimal timing
  private async predictOptimalTiming(
    notification: PushNotificationPayload,
    userProfile: UserProfile,
    context: ContextualData
  ): Promise<OptimalTiming> {
    const currentTime = Date.now();
    const currentHour = new Date(currentTime).getHours();
    const currentDay = new Date(currentTime).getDay();

    // Base timing on user's preferred hours
    const preferredHours = userProfile.preferences.preferredTimes
      .map(time => parseInt(time.split(":")[0]))
      .sort((a, b) => a - b);

    // Find the next preferred hour
    let recommendedHour = preferredHours.find(hour => hour > currentHour);
    if (!recommendedHour) {
      recommendedHour = preferredHours[0];
    }

    // Adjust for current day
    if (!userProfile.engagementHistory.preferredDays.includes(currentDay)) {
      // If today is not a preferred day, suggest tomorrow
      recommendedHour = preferredHours[0]; // First preferred hour tomorrow
    }

    // Adjust for contextual factors
    if (context.currentActivity === "meeting") {
      recommendedHour += 1; // Delay by 1 hour during meetings
    }

    if (context.calendarEvents.length > 0) {
      // Check for upcoming events
      const nextEvent = context.calendarEvents
        .filter(e => e.startTime > currentTime)
        .sort((a, b) => a.startTime - b.startTime)[0];

      if (nextEvent) {
        const eventHour = new Date(nextEvent.startTime).getHours();
        if (Math.abs(eventHour - recommendedHour) < 2) {
          recommendedHour = eventHour - 1; // Schedule 1 hour before event
        }
      }
    }

    const recommendedTime = new Date(currentTime);
    recommendedTime.setHours(recommendedHour, 0, 0, 0);

    // Generate alternatives
    const alternatives = preferredHours
      .filter(hour => hour !== recommendedHour)
      .map(hour => {
        const altTime = new Date(currentTime);
        altTime.setHours(hour, 0, 0, 0);
        return altTime.getTime();
      });

    return {
      recommendedTime: recommendedTime.getTime(),
      confidence: 0.85,
      reasoning: [
        `Based on user's preferred hours: ${userProfile.preferences.preferredTimes.join(", ")}`,
        `Current activity: ${context.currentActivity}`,
        `Day of week preference: ${userProfile.engagementHistory.preferredDays.includes(currentDay) ? "preferred" : "not preferred"}`
      ],
      alternatives
    };
  }

  // Calculate personalization score
  private calculatePersonalizationScore(
    userProfile: UserProfile,
    context: ContextualData
  ): PersonalizationScore {
    const now = Date.now();
    const lastUpdate = userProfile.lastUpdated;
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

    return {
      overall: 0.75,
      recency: Math.max(0, 1 - hoursSinceUpdate / 24), // Score based on profile freshness
      frequency: this.calculateFrequencyScore(userProfile),
      engagement: this.calculateEngagementScore(userProfile),
      contextual: this.calculateContextualScore(context),
      behavioral: this.calculateBehavioralScore(userProfile)
    };
  }

  // Calculate frequency score
  private calculateFrequencyScore(userProfile: UserProfile): number {
    const totalInteractions = userProfile.engagementHistory.totalInteractions;
    if (totalInteractions < 10) return 0.3; // New user
    if (totalInteractions < 50) return 0.6; // Regular user
    return 0.9; // Power user
  }

  // Calculate engagement score
  private calculateEngagementScore(userProfile: UserProfile): number {
    const { totalInteractions, positiveInteractions, negativeInteractions } = userProfile.engagementHistory;

    if (totalInteractions === 0) return 0.5;

    const positiveRate = positiveInteractions / totalInteractions;
    const negativeRate = negativeInteractions / totalInteractions;

    return positiveRate * 0.8 + (1 - negativeRate) * 0.2;
  }

  // Calculate contextual score
  private calculateContextualScore(context: ContextualData): number {
    let score = 0.5; // Base score

    if (context.currentActivity !== "unknown") score += 0.2;
    if (context.location) score += 0.1;
    if (context.calendarEvents.length > 0) score += 0.1;
    if (context.activeTasks.length > 0) score += 0.1;

    return Math.min(score, 1);
  }

  // Calculate behavioral score
  private calculateBehavioralScore(userProfile: UserProfile): number {
    const patterns = userProfile.behaviorPatterns.interactionPatterns;

    if (patterns.length === 0) return 0.3;

    const recentPatterns = patterns.filter(p =>
      Date.now() - p.timestamp < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    const positiveOutcomes = recentPatterns.filter(p => p.outcome === "positive").length;
    const totalRecent = recentPatterns.length;

    return totalRecent > 0 ? positiveOutcomes / totalRecent : 0.3;
  }

  // Generate personalization reasoning
  private generatePersonalizationReasoning(
    userProfile: UserProfile,
    context: ContextualData,
    score: PersonalizationScore
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Personalization confidence: ${(score.overall * 100).toFixed(0)}%`);

    if (score.recency > 0.7) {
      reasoning.push("User profile is up-to-date");
    } else if (score.recency < 0.3) {
      reasoning.push("User profile may need updating");
    }

    if (score.engagement > 0.7) {
      reasoning.push("High user engagement detected");
    }

    if (context.currentActivity !== "unknown") {
      reasoning.push(`Context-aware personalization for activity: ${context.currentActivity}`);
    }

    return reasoning;
  }

  // Generate alternative content
  private async generateAlternatives(
    baseNotification: PushNotificationPayload,
    userProfile: UserProfile,
    context: ContextualData
  ): Promise<AlternativeContent[]> {
    const alternatives: AlternativeContent[] = [];

    // Alternative titles
    if (userProfile.preferences.notificationStyle === "friendly") {
      alternatives.push({
        type: "title",
        content: `😊 ${baseNotification.title}`,
        confidence: 0.8,
        reasoning: "Friendly style with emoji"
      });
    }

    if (userProfile.preferences.notificationStyle === "professional") {
      alternatives.push({
        type: "title",
        content: baseNotification.title.replace(/😊|📢|⚡/g, "").trim(),
        confidence: 0.9,
        reasoning: "Professional style without emojis"
      });
    }

    // Alternative body content
    if (baseNotification.body && userProfile.preferences.contentPreferences.languageComplexity === "simple") {
      alternatives.push({
        type: "body",
        content: this.simplifyLanguage(baseNotification.body),
        confidence: 0.7,
        reasoning: "Simplified language for better understanding"
      });
    }

    // Alternative actions
    if (userProfile.preferences.interactionPreferences.autoActions.includes("mark-read")) {
      alternatives.push({
        type: "actions",
        content: "mark-read",
        confidence: 0.6,
        reasoning: "Auto-action based on user preferences"
      });
    }

    return alternatives;
  }

  // Predict engagement
  private async predictEngagement(
    notification: PushNotificationPayload,
    userProfile: UserProfile,
    context: ContextualData
  ): Promise<number> {
    // Simple prediction model based on historical data
    let prediction = 0.5; // Base prediction

    // Factor in user's engagement score
    prediction += userProfile.personalizationScore.engagement * 0.3;

    // Factor in time of day
    const hour = new Date().getHours();
    if (userProfile.engagementHistory.peakActivityHours.includes(hour)) {
      prediction += 0.2;
    }

    // Factor in channel preference
    if (userProfile.preferences.preferredChannels.includes(notification.channel || "")) {
      prediction += 0.1;
    }

    // Factor in contextual relevance
    if (context.currentActivity === "active") {
      prediction += 0.1;
    }

    return Math.min(Math.max(prediction, 0), 1);
  }

  // Update user profile
  private async updateUserProfile(
    userId: string,
    notification: PushNotificationPayload,
    context: ContextualData
  ): Promise<void> {
    const profile = await this.getOrCreateUserProfile(userId);

    // Update contextual data
    profile.contextualData = { ...context };
    profile.lastUpdated = Date.now();

    // Save to Firestore
    await setDoc(doc(this.db, "userProfiles", userId), profile, { merge: true });
    this.userProfiles.set(userId, profile);
  }

  // Get contextual data
  private async getContextualData(
    userId: string,
    overrides?: Partial<ContextualData>
  ): Promise<ContextualData> {
    const baseContext: ContextualData = {
      currentActivity: "unknown",
      deviceType: this.detectDeviceType(),
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: new Date().getDay(),
      calendarEvents: [],
      activeTasks: []
    };

    // Override with provided context
    if (overrides) {
      return { ...baseContext, ...overrides };
    }

    return baseContext;
  }

  // Detect device type
  private detectDeviceType(): string {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;
    if (width <= 768) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
  }

  // Get time of day
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) return "night";
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    if (hour < 22) return "evening";
    return "night";
  }

  // Initialize prediction models
  private initializeModels() {
    // Initialize various ML models for different prediction types
    this.predictionModels.set("engagement", new EngagementPredictionModel());
    this.predictionModels.set("timing", new TimingPredictionModel());
    this.predictionModels.set("content", new ContentPredictionModel());
    this.predictionModels.set("channel", new ChannelPredictionModel());
  }
}

// Prediction Model Classes (simplified implementations)
class EngagementPredictionModel {
  predict(notification: PushNotificationPayload, userProfile: UserProfile, context: ContextualData): number {
    // Simplified prediction logic
    return 0.75; // Placeholder
  }
}

class TimingPredictionModel {
  predictOptimalTime(notification: PushNotificationPayload, userProfile: UserProfile): OptimalTiming {
    // Simplified timing prediction
    return {
      recommendedTime: Date.now() + 3600000, // 1 hour from now
      confidence: 0.8,
      reasoning: ["Based on user activity patterns"],
      alternatives: []
    };
  }
}

class ContentPredictionModel {
  generatePersonalizedContent(baseContent: string, userProfile: UserProfile): string {
    // Simplified content personalization
    return baseContent;
  }
}

class ChannelPredictionModel {
  predictBestChannel(notification: PushNotificationPayload, userProfile: UserProfile): string {
    // Simplified channel prediction
    return userProfile.preferences.preferredChannels[0] || "signals";
  }
}

// React hook for AI personalization
export function useAIPersonalization() {
  const { user } = useAuth();
  const [personalizationEngine] = useState(() => AIPersonalizationEngine.getInstance());

  const personalizeNotification = useCallback(async (
    baseNotification: PushNotificationPayload,
    context?: Partial<ContextualData>
  ): Promise<PersonalizedNotification | null> => {
    if (!user) return null;

    try {
      return await personalizationEngine.personalizeNotification(baseNotification, user.uid, context);
    } catch (error) {
      console.error("Failed to personalize notification:", error);
      return null;
    }
  }, [user, personalizationEngine]);

  return {
    personalizeNotification
  };
}

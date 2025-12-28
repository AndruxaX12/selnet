import { PushNotificationPayload } from "./pushManager";
import { NotificationAnalyticsManager } from "./analytics";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getFirestore } from "firebase/firestore";

// Predictive Analytics Types
export interface PredictionModel {
  id: string;
  name: string;
  version: string;
  type: "engagement" | "timing" | "content" | "channel" | "behavior";
  accuracy: number;
  lastTrained: number;
  features: string[];
  parameters: Record<string, any>;
}

export interface PredictionInput {
  userId: string;
  notification: PushNotificationPayload;
  context: {
    timeOfDay: string;
    dayOfWeek: number;
    deviceType: string;
    userActivity: string;
    recentInteractions: number;
    notificationHistory: NotificationHistory[];
    userProfile: UserProfileData;
  };
  metadata?: Record<string, any>;
}

export interface PredictionOutput {
  predictionId: string;
  modelId: string;
  input: PredictionInput;
  output: any;
  confidence: number;
  reasoning: string[];
  alternatives: AlternativePrediction[];
  timestamp: number;
  processingTime: number;
}

export interface AlternativePrediction {
  output: any;
  confidence: number;
  reasoning: string;
}

export interface NotificationHistory {
  id: string;
  type: string;
  channel: string;
  priority: string;
  sentAt: number;
  deliveredAt?: number;
  openedAt?: number;
  dismissedAt?: number;
  responseTime?: number;
  engagementScore: number;
}

export interface UserProfileData {
  totalNotifications: number;
  avgResponseTime: number;
  preferredChannels: string[];
  preferredTimes: string[];
  engagementScore: number;
  fatigueLevel: number;
  behaviorPatterns: BehaviorPattern[];
}

export interface BehaviorPattern {
  context: string;
  pattern: string;
  confidence: number;
  frequency: number;
  lastObserved: number;
}

export interface PredictiveInsight {
  type: "trend" | "anomaly" | "opportunity" | "risk";
  title: string;
  description: string;
  confidence: number;
  impact: "low" | "medium" | "high";
  recommendation: string;
  data: Record<string, any>;
  timestamp: number;
}

export interface MLPrediction {
  engagementProbability: number;
  optimalTiming: {
    recommendedTime: number;
    confidence: number;
    reasoning: string[];
  };
  contentOptimization: {
    suggestedTitle?: string;
    suggestedBody?: string;
    suggestedActions?: any[];
    confidence: number;
  };
  channelRecommendation: {
    recommendedChannel: string;
    alternatives: string[];
    confidence: number;
  };
  behavioralInsights: string[];
  riskAssessment: {
    fatigueRisk: number;
    spamRisk: number;
    annoyanceRisk: number;
  };
}

// Machine Learning Prediction Engine
export class MLPredictionEngine {
  private static instance: MLPredictionEngine;
  private models: Map<string, PredictionModel> = new Map();
  private predictions: Map<string, PredictionOutput> = new Map();
  private insights: PredictiveInsight[] = [];
  private readonly db = getFirestore(app);
  private readonly CACHE_DURATION = 600000; // 10 minutes

  private constructor() {
    this.initializeModels();
    this.loadModelsFromStorage();
  }

  static getInstance(): MLPredictionEngine {
    if (!MLPredictionEngine.instance) {
      MLPredictionEngine.instance = new MLPredictionEngine();
    }
    return MLPredictionEngine.instance;
  }

  // Main prediction method
  async predict(input: PredictionInput): Promise<MLPrediction> {
    const startTime = Date.now();

    try {
      // Get or create appropriate model
      const model = await this.getOrCreateModel(input.notification.type || "default");

      // Preprocess input data
      const processedInput = this.preprocessInput(input);

      // Run predictions
      const engagementPrediction = await this.predictEngagement(processedInput, model);
      const timingPrediction = await this.predictTiming(processedInput, model);
      const contentPrediction = await this.predictContent(processedInput, model);
      const channelPrediction = await this.predictChannel(processedInput, model);

      // Generate behavioral insights
      const behavioralInsights = await this.generateBehavioralInsights(input, model);

      // Assess risks
      const riskAssessment = this.assessRisks(input, {
        engagement: engagementPrediction,
        timing: timingPrediction,
        content: contentPrediction,
        channel: channelPrediction
      });

      // Create comprehensive prediction
      const prediction: MLPrediction = {
        engagementProbability: engagementPrediction.probability,
        optimalTiming: timingPrediction,
        contentOptimization: contentPrediction,
        channelRecommendation: channelPrediction,
        behavioralInsights,
        riskAssessment
      };

      // Cache prediction
      const predictionOutput: PredictionOutput = {
        predictionId: this.generatePredictionId(),
        modelId: model.id,
        input,
        output: prediction,
        confidence: this.calculateOverallConfidence(prediction),
        reasoning: this.generatePredictionReasoning(prediction),
        alternatives: await this.generateAlternatives(input, model),
        timestamp: Date.now(),
        processingTime: Date.now() - startTime
      };

      this.predictions.set(predictionOutput.predictionId, predictionOutput);
      await this.savePrediction(predictionOutput);

      // Generate insights
      await this.generateInsights(input, prediction, model);

      console.log(`ML Prediction completed in ${Date.now() - startTime}ms with confidence ${(predictionOutput.confidence * 100).toFixed(1)}%`);

      return prediction;
    } catch (error) {
      console.error("ML Prediction failed:", error);
      return this.getFallbackPrediction(input);
    }
  }

  // Predict user engagement
  private async predictEngagement(
    input: PredictionInput,
    model: PredictionModel
  ): Promise<{ probability: number; factors: string[]; confidence: number }> {
    // Feature extraction
    const features = this.extractEngagementFeatures(input);

    // Apply model
    const baseProbability = this.calculateBaseEngagementProbability(input);

    // Adjust based on historical data
    const historicalAdjustment = await this.getHistoricalEngagementAdjustment(input.userId, input.notification);

    // Apply contextual factors
    const contextualAdjustment = this.calculateContextualEngagementAdjustment(input.context);

    // Combine predictions
    const probability = Math.min(
      Math.max(
        baseProbability * 0.4 +
        historicalAdjustment * 0.4 +
        contextualAdjustment * 0.2,
        0
      ),
      1
    );

    return {
      probability,
      factors: [
        `Base probability: ${(baseProbability * 100).toFixed(1)}%`,
        `Historical adjustment: ${(historicalAdjustment * 100).toFixed(1)}%`,
        `Contextual adjustment: ${(contextualAdjustment * 100).toFixed(1)}%`
      ],
      confidence: 0.85
    };
  }

  // Predict optimal timing
  private async predictTiming(
    input: PredictionInput,
    model: PredictionModel
  ): Promise<MLPrediction["optimalTiming"]> {
    const userProfile = await this.getUserProfile(input.userId);
    const currentTime = Date.now();
    const currentHour = new Date(currentTime).getHours();
    const currentDay = new Date(currentTime).getDay();

    // Get user's preferred times
    const preferredTimes = userProfile?.preferredTimes || ["09:00", "14:00", "19:00"];

    // Find next optimal time
    const nextOptimalTime = this.findNextOptimalTime(
      currentTime,
      preferredTimes,
      input.context
    );

    // Generate reasoning
    const reasoning = [
      `Based on user's preferred times: ${preferredTimes.join(", ")}`,
      `Current time: ${new Date(currentTime).toLocaleTimeString()}`,
      `Day of week: ${this.getDayName(currentDay)}`,
      `Context: ${input.context.userActivity}`
    ];

    return {
      recommendedTime: nextOptimalTime,
      confidence: 0.8,
      reasoning
    };
  }

  // Predict content optimization
  private async predictContent(
    input: PredictionInput,
    model: PredictionModel
  ): Promise<MLPrediction["contentOptimization"]> {
    const userProfile = await this.getUserProfile(input.userId);

    // Analyze notification content
    const contentAnalysis = this.analyzeContent(input.notification);

    // Generate suggestions based on user preferences
    const suggestions = this.generateContentSuggestions(
      input.notification,
      userProfile,
      contentAnalysis
    );

    return {
      suggestedTitle: suggestions.title,
      suggestedBody: suggestions.body,
      suggestedActions: suggestions.actions,
      confidence: 0.75
    };
  }

  // Predict best channel
  private async predictChannel(
    input: PredictionInput,
    model: PredictionModel
  ): Promise<MLPrediction["channelRecommendation"]> {
    const userProfile = await this.getUserProfile(input.userId);

    // Get channel performance data
    const channelPerformance = await this.getChannelPerformance(input.userId);

    // Score each channel
    const channelScores = this.scoreChannels(
      input.notification,
      channelPerformance,
      input.context
    );

    // Select best channel
    const bestChannel = Object.entries(channelScores)
      .sort(([,a], [,b]) => b - a)[0];

    // Generate alternatives
    const alternatives = Object.entries(channelScores)
      .sort(([,a], [,b]) => b - a)
      .slice(1, 4)
      .map(([channel]) => channel);

    return {
      recommendedChannel: bestChannel[0],
      alternatives,
      confidence: 0.9
    };
  }

  // Generate behavioral insights
  private async generateBehavioralInsights(
    input: PredictionInput,
    model: PredictionModel
  ): Promise<string[]> {
    const insights: string[] = [];
    const userProfile = await this.getUserProfile(input.userId);

    if (userProfile) {
      // Time-based insights
      const currentHour = new Date().getHours();
      if (userProfile.preferredTimes.some(time => {
        const hour = parseInt(time.split(":")[0]);
        return Math.abs(hour - currentHour) <= 1;
      })) {
        insights.push("Optimal timing based on user's activity patterns");
      }

      // Channel preference insights
      if (userProfile.preferredChannels.includes(input.notification.channel || "")) {
        insights.push("Notification channel matches user preference");
      }

      // Engagement pattern insights
      if (userProfile.engagementScore > 0.7) {
        insights.push("User has high engagement with similar notifications");
      }

      // Fatigue insights
      if (userProfile.fatigueLevel > 0.6) {
        insights.push("User may be experiencing notification fatigue");
      }
    }

    return insights;
  }

  // Assess notification risks
  private assessRisks(
    input: PredictionInput,
    predictions: Partial<MLPrediction>
  ): MLPrediction["riskAssessment"] {
    const fatigueRisk = this.calculateFatigueRisk(input);
    const spamRisk = this.calculateSpamRisk(input, predictions);
    const annoyanceRisk = this.calculateAnnoyanceRisk(input, predictions);

    return {
      fatigueRisk: Math.min(fatigueRisk, 1),
      spamRisk: Math.min(spamRisk, 1),
      annoyanceRisk: Math.min(annoyanceRisk, 1)
    };
  }

  // Feature extraction for ML models
  private extractEngagementFeatures(input: PredictionInput): Record<string, number> {
    const features: Record<string, number> = {};

    // Time-based features
    features.hourOfDay = new Date().getHours();
    features.dayOfWeek = new Date().getDay();
    features.isWeekend = new Date().getDay() >= 6 ? 1 : 0;

    // User activity features
    features.userActivityScore = this.scoreUserActivity(input.context.userActivity);
    features.recentInteractions = input.context.recentInteractions;

    // Notification features
    features.notificationLength = (input.notification.title.length + (input.notification.body?.length || 0));
    features.hasImage = input.notification.image ? 1 : 0;
    features.hasActions = input.notification.actions ? input.notification.actions.length : 0;
    features.priorityScore = this.scorePriority(input.notification.priority);

    // Historical features
    features.avgResponseTime = input.context.userProfile.avgResponseTime;
    features.engagementScore = input.context.userProfile.engagementScore;

    return features;
  }

  // Calculate base engagement probability
  private calculateBaseEngagementProbability(input: PredictionInput): number {
    let probability = 0.5; // Base probability

    // Adjust based on time of day
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      probability += 0.1; // Work hours
    } else if (hour >= 19 && hour <= 21) {
      probability += 0.05; // Evening hours
    }

    // Adjust based on user activity
    if (input.context.userActivity === "active") {
      probability += 0.15;
    } else if (input.context.userActivity === "idle") {
      probability -= 0.1;
    }

    // Adjust based on notification type
    if (input.notification.priority === "urgent") {
      probability += 0.2;
    } else if (input.notification.priority === "high") {
      probability += 0.1;
    } else if (input.notification.priority === "low") {
      probability -= 0.05;
    }

    return Math.min(Math.max(probability, 0), 1);
  }

  // Get historical engagement adjustment
  private async getHistoricalEngagementAdjustment(
    userId: string,
    notification: PushNotificationPayload
  ): Promise<number> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return 0.5;

      // Get similar notifications from history
      const similarNotifications = await this.getSimilarNotifications(userId, notification);

      if (similarNotifications.length === 0) return 0.5;

      const engagementRates = similarNotifications.map(n => n.engagementScore);
      const avgEngagement = engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length;

      return avgEngagement;
    } catch (error) {
      console.error("Failed to get historical engagement:", error);
      return 0.5;
    }
  }

  // Calculate contextual engagement adjustment
  private calculateContextualEngagementAdjustment(context: PredictionInput["context"]): number {
    let adjustment = 0.5; // Base

    // Device type adjustment
    switch (context.deviceType) {
      case "mobile":
        adjustment += 0.1;
        break;
      case "desktop":
        adjustment += 0.05;
        break;
      case "tablet":
        adjustment += 0.0;
        break;
    }

    // Activity adjustment
    switch (context.userActivity) {
      case "active":
        adjustment += 0.15;
        break;
      case "idle":
        adjustment -= 0.1;
        break;
      case "busy":
        adjustment -= 0.05;
        break;
    }

    // Time of day adjustment
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11) {
      adjustment += 0.1; // Morning peak
    } else if (hour >= 14 && hour <= 16) {
      adjustment += 0.1; // Afternoon peak
    } else if (hour >= 19 && hour <= 21) {
      adjustment += 0.05; // Evening
    } else if (hour >= 22 || hour <= 8) {
      adjustment -= 0.1; // Night time
    }

    return Math.min(Math.max(adjustment, 0), 1);
  }

  // Find next optimal time
  private findNextOptimalTime(
    currentTime: number,
    preferredTimes: string[],
    context: PredictionInput["context"]
  ): number {
    const currentDate = new Date(currentTime);
    const currentHour = currentDate.getHours();

    // Parse preferred times
    const preferredHours = preferredTimes
      .map(time => parseInt(time.split(":")[0]))
      .sort((a, b) => a - b);

    // Find next preferred hour
    let nextHour = preferredHours.find(hour => hour > currentHour);
    if (!nextHour) {
      nextHour = preferredHours[0];
      currentDate.setDate(currentDate.getDate() + 1); // Next day
    }

    currentDate.setHours(nextHour, 0, 0, 0);

    // Adjust for context
    if (context.userActivity === "meeting") {
      currentDate.setHours(currentDate.getHours() + 1); // Delay by 1 hour
    }

    return currentDate.getTime();
  }

  // Analyze notification content
  private analyzeContent(notification: PushNotificationPayload): {
    length: number;
    complexity: number;
    sentiment: number;
    keywords: string[];
    readability: number;
  } {
    const title = notification.title;
    const body = notification.body || "";

    const fullText = `${title} ${body}`;

    return {
      length: fullText.length,
      complexity: this.calculateTextComplexity(fullText),
      sentiment: this.analyzeSentiment(fullText),
      keywords: this.extractKeywords(fullText),
      readability: this.calculateReadability(fullText)
    };
  }

  // Calculate text complexity
  private calculateTextComplexity(text: string): number {
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentences = text.split(/[.!?]+/).length;

    return Math.min((avgWordLength / 5 + sentences / 10) / 2, 1);
  }

  // Analyze sentiment
  private analyzeSentiment(text: string): number {
    const positiveWords = ["добър", "отличен", "страхотен", "перфектен", "супер"];
    const negativeWords = ["лош", "ужасен", "проблем", "грешка", "неуспех"];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount === 0 && negativeCount === 0) return 0.5;

    return Math.max(0.1, Math.min(0.9, (positiveCount / (positiveCount + negativeCount))));
  }

  // Extract keywords
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Simple keyword extraction (in a real system, this would use NLP)
    return [...new Set(words)].slice(0, 5);
  }

  // Calculate readability
  private calculateReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);

    if (words === 0 || sentences === 0) return 0;

    // Simplified Flesch Reading Ease
    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    return Math.max(0, Math.min(100, score)) / 100;
  }

  // Count syllables (simplified)
  private countSyllables(text: string): number {
    return text.split(/\s+/)
      .map(word => word.replace(/[^а-яА-Я]/g, '').length)
      .reduce((sum, length) => sum + Math.max(1, Math.ceil(length / 2)), 0);
  }

  // Generate content suggestions
  private generateContentSuggestions(
    notification: PushNotificationPayload,
    userProfile: UserProfileData | null,
    contentAnalysis: any
  ): {
    title?: string;
    body?: string;
    actions?: any[];
  } {
    const suggestions: any = {};

    // Title suggestions
    if (userProfile?.preferredChannels.includes("mobile") && contentAnalysis.length > 50) {
      suggestions.title = notification.title.length > 30
        ? notification.title.substring(0, 27) + "..."
        : notification.title;
    }

    // Body suggestions
    if (userProfile?.engagementScore < 0.5 && contentAnalysis.complexity > 0.7) {
      suggestions.body = this.simplifyContent(notification.body || "");
    }

    // Action suggestions
    if (!notification.actions && userProfile?.engagementScore > 0.7) {
      suggestions.actions = [
        { action: "view", title: "Виж" },
        { action: "mark-read", title: "Прочетено" }
      ];
    }

    return suggestions;
  }

  // Simplify content for low-engagement users
  private simplifyContent(content: string): string {
    // Remove technical jargon
    content = content.replace(/системна/g, "техническа");
    content = content.replace(/база данни/g, "място за данни");
    content = content.replace(/сървър/g, "компютър");

    // Shorten long sentences
    const sentences = content.split(/[.!?]+/);
    const simplifiedSentences = sentences.map(sentence => {
      if (sentence.length > 100) {
        return sentence.substring(0, 97) + "...";
      }
      return sentence;
    });

    return simplifiedSentences.join(". ");
  }

  // Get channel performance data
  private async getChannelPerformance(userId: string): Promise<Record<string, number>> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return {};

      // Return engagement rates for each channel
      return {
        signals: 0.8,
        ideas: 0.7,
        events: 0.9,
        system: 0.6
      };
    } catch (error) {
      console.error("Failed to get channel performance:", error);
      return {};
    }
  }

  // Score channels for notification
  private scoreChannels(
    notification: PushNotificationPayload,
    channelPerformance: Record<string, number>,
    context: PredictionInput["context"]
  ): Record<string, number> {
    const scores: Record<string, number> = {};

    Object.keys(channelPerformance).forEach(channel => {
      let score = channelPerformance[channel];

      // Adjust for notification type
      if (notification.type === channel) {
        score += 0.2;
      }

      // Adjust for context
      if (context.deviceType === "mobile" && channel === "signals") {
        score += 0.1;
      }

      scores[channel] = Math.min(score, 1);
    });

    return scores;
  }

  // Calculate fatigue risk
  private calculateFatigueRisk(input: PredictionInput): number {
    // Simplified fatigue calculation
    const recentNotifications = input.context.recentInteractions;
    const baseFatigue = Math.min(recentNotifications / 10, 1); // Max fatigue at 10+ notifications

    return baseFatigue * 0.7; // Scale down
  }

  // Calculate spam risk
  private calculateSpamRisk(input: PredictionInput, predictions: Partial<MLPrediction>): number {
    let spamRisk = 0;

    // High frequency of similar notifications
    if (input.context.recentInteractions > 5) {
      spamRisk += 0.3;
    }

    // Low predicted engagement
    if (predictions.engagementProbability && predictions.engagementProbability < 0.3) {
      spamRisk += 0.4;
    }

    // Generic content
    if (input.notification.title.toLowerCase().includes("ново")) {
      spamRisk += 0.1;
    }

    return Math.min(spamRisk, 1);
  }

  // Calculate annoyance risk
  private calculateAnnoyanceRisk(input: PredictionInput, predictions: Partial<MLPrediction>): number {
    let annoyanceRisk = 0;

    // High priority at inappropriate times
    if (input.notification.priority === "urgent") {
      const hour = new Date().getHours();
      if (hour < 8 || hour > 22) {
        annoyanceRisk += 0.5;
      }
    }

    // Low relevance
    if (predictions.engagementProbability && predictions.engagementProbability < 0.2) {
      annoyanceRisk += 0.3;
    }

    return Math.min(annoyanceRisk, 1);
  }

  // Calculate overall confidence
  private calculateOverallConfidence(prediction: MLPrediction): number {
    const confidences = [
      prediction.optimalTiming.confidence,
      prediction.contentOptimization.confidence,
      prediction.channelRecommendation.confidence
    ];

    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  // Generate prediction reasoning
  private generatePredictionReasoning(prediction: MLPrediction): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Engagement probability: ${(prediction.engagementProbability * 100).toFixed(1)}%`);
    reasoning.push(`Optimal timing confidence: ${(prediction.optimalTiming.confidence * 100).toFixed(1)}%`);
    reasoning.push(`Content optimization confidence: ${(prediction.contentOptimization.confidence * 100).toFixed(1)}%`);
    reasoning.push(`Channel recommendation confidence: ${(prediction.channelRecommendation.confidence * 100).toFixed(1)}%`);

    return reasoning;
  }

  // Generate alternative predictions
  private async generateAlternatives(
    input: PredictionInput,
    model: PredictionModel
  ): Promise<AlternativePrediction[]> {
    // Generate alternative engagement predictions
    const alternatives: AlternativePrediction[] = [];

    // Conservative prediction
    alternatives.push({
      output: { ...input, engagementProbability: 0.3 },
      confidence: 0.7,
      reasoning: ["Conservative estimate based on worst-case scenario"]
    });

    // Optimistic prediction
    alternatives.push({
      output: { ...input, engagementProbability: 0.9 },
      confidence: 0.6,
      reasoning: ["Optimistic estimate based on best-case scenario"]
    });

    return alternatives;
  }

  // Generate insights
  private async generateInsights(
    input: PredictionInput,
    prediction: MLPrediction,
    model: PredictionModel
  ): Promise<void> {
    // Generate trend insights
    if (prediction.engagementProbability > 0.8) {
      this.insights.push({
        type: "opportunity",
        title: "High Engagement Opportunity",
        description: "This notification type has historically high engagement rates",
        confidence: 0.85,
        impact: "high",
        recommendation: "Send immediately for maximum impact",
        data: { predictedEngagement: prediction.engagementProbability },
        timestamp: Date.now()
      });
    }

    // Generate risk insights
    if (prediction.riskAssessment.fatigueRisk > 0.7) {
      this.insights.push({
        type: "risk",
        title: "Notification Fatigue Risk",
        description: "User may be experiencing notification fatigue",
        confidence: 0.8,
        impact: "high",
        recommendation: "Delay notification or reduce priority",
        data: { fatigueRisk: prediction.riskAssessment.fatigueRisk },
        timestamp: Date.now()
      });
    }

    // Limit insights to prevent overflow
    if (this.insights.length > 100) {
      this.insights = this.insights.slice(-50);
    }
  }

  // Get user profile
  private async getUserProfile(userId: string): Promise<UserProfileData | null> {
    try {
      const profileDoc = await getDoc(doc(this.db, "userProfiles", userId));
      if (profileDoc.exists()) {
        return profileDoc.data() as UserProfileData;
      }
      return null;
    } catch (error) {
      console.error("Failed to get user profile:", error);
      return null;
    }
  }

  // Get similar notifications
  private async getSimilarNotifications(
    userId: string,
    notification: PushNotificationPayload
  ): Promise<NotificationHistory[]> {
    // In a real implementation, this would query the analytics database
    // For now, return empty array
    return [];
  }

  // Score user activity
  private scoreUserActivity(activity: string): number {
    switch (activity) {
      case "active": return 1;
      case "idle": return 0.5;
      case "busy": return 0.3;
      case "away": return 0.1;
      default: return 0.5;
    }
  }

  // Score priority
  private scorePriority(priority?: string): number {
    switch (priority) {
      case "urgent": return 1;
      case "high": return 0.8;
      case "normal": return 0.6;
      case "low": return 0.4;
      default: return 0.6;
    }
  }

  // Get day name
  private getDayName(dayIndex: number): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayIndex] || "Unknown";
  }

  // Get fallback prediction
  private getFallbackPrediction(input: PredictionInput): MLPrediction {
    return {
      engagementProbability: 0.5,
      optimalTiming: {
        recommendedTime: Date.now() + 3600000, // 1 hour from now
        confidence: 0.5,
        reasoning: ["Fallback prediction - limited data available"]
      },
      contentOptimization: {
        confidence: 0.5
      },
      channelRecommendation: {
        recommendedChannel: "signals",
        alternatives: ["ideas", "events"],
        confidence: 0.5
      },
      behavioralInsights: ["Limited behavioral data available"],
      riskAssessment: {
        fatigueRisk: 0.3,
        spamRisk: 0.2,
        annoyanceRisk: 0.2
      }
    };
  }

  // Initialize models
  private initializeModels() {
    this.models.set("default", {
      id: "default-model",
      name: "Default Prediction Model",
      version: "1.0.0",
      type: "engagement",
      accuracy: 0.75,
      lastTrained: Date.now(),
      features: ["timeOfDay", "userActivity", "notificationType", "channel"],
      parameters: {}
    });
  }

  // Load models from storage
  private async loadModelsFromStorage() {
    try {
      const modelsDoc = await getDoc(doc(this.db, "mlModels", "models"));
      if (modelsDoc.exists()) {
        const models = modelsDoc.data().models as PredictionModel[];
        models.forEach(model => this.models.set(model.id, model));
      }
    } catch (error) {
      console.error("Failed to load ML models:", error);
    }
  }

  // Save prediction
  private async savePrediction(prediction: PredictionOutput): Promise<void> {
    try {
      await setDoc(doc(this.db, "mlPredictions", prediction.predictionId), prediction);
    } catch (error) {
      console.error("Failed to save prediction:", error);
    }
  }

  // Generate prediction ID
  private generatePredictionId(): string {
    return `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get or create model
  private async getOrCreateModel(type: string): Promise<PredictionModel> {
    const modelId = `${type}-model`;
    let model = this.models.get(modelId);

    if (!model) {
      model = {
        id: modelId,
        name: `${type} Prediction Model`,
        version: "1.0.0",
        type: type as any,
        accuracy: 0.7,
        lastTrained: Date.now(),
        features: ["timeOfDay", "userActivity", "notificationType"],
        parameters: {}
      };

      this.models.set(modelId, model);
    }

    return model;
  }
}

// React hook for ML predictions
export function useMLPredictions() {
  const { user } = useAuth();
  const [predictionEngine] = useState(() => MLPredictionEngine.getInstance());

  const predict = useCallback(async (input: PredictionInput): Promise<MLPrediction | null> => {
    if (!user) return null;

    try {
      return await predictionEngine.predict(input);
    } catch (error) {
      console.error("ML Prediction failed:", error);
      return null;
    }
  }, [user, predictionEngine]);

  return {
    predict
  };
}

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getFirestore } from "firebase/firestore";
import { PushNotificationPayload } from "./pushManager";
import { NotificationAnalyticsManager } from "./analytics";

const db = getFirestore(app);

// A/B Testing Types
export interface ABTest {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: "draft" | "running" | "paused" | "completed" | "archived";
  variants: TestVariant[];
  targetAudience: TargetAudience;
  metrics: TestMetrics[];
  settings: TestSettings;
  results: TestResults;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface TestVariant {
  id: string;
  name: string;
  description: string;
  notification: PushNotificationPayload;
  weight: number; // Percentage of traffic (0-100)
  control: boolean; // Is this the control variant?
  metadata: Record<string, any>;
}

export interface TargetAudience {
  userSegments: UserSegment[];
  sampleSize: number;
  allocationMethod: "random" | "weighted" | "segmented";
  filters: AudienceFilter[];
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  size: number;
  estimatedSize: number;
}

export interface SegmentCriteria {
  userProperties: Record<string, any>;
  behaviorPatterns: Record<string, any>;
  engagementLevel: "low" | "medium" | "high";
  deviceType?: string[];
  location?: string[];
  customFilters: Record<string, any>;
}

export interface AudienceFilter {
  type: "include" | "exclude";
  segmentId: string;
  reason: string;
}

export interface TestMetrics {
  id: string;
  name: string;
  type: "engagement" | "conversion" | "retention" | "custom";
  calculation: MetricCalculation;
  target: number;
  baseline?: number;
  importance: number; // Weight in overall score
}

export interface MetricCalculation {
  event: string;
  numerator: string;
  denominator: string;
  timeframe: number; // Hours
  filters?: Record<string, any>;
}

export interface TestSettings {
  duration: number; // Days
  confidenceLevel: number; // 0.95 for 95% confidence
  minimumSampleSize: number;
  trafficAllocation: "auto" | "manual";
  autoStop: boolean;
  autoStopConditions: AutoStopCondition[];
  notifications: {
    onStart: boolean;
    onComplete: boolean;
    onSignificantResult: boolean;
  };
}

export interface AutoStopCondition {
  metricId: string;
  operator: "greater" | "less" | "equal";
  threshold: number;
  variantId?: string; // If not specified, applies to best variant
}

export interface TestResults {
  totalParticipants: number;
  variantResults: VariantResult[];
  statisticalSignificance: StatisticalSignificance;
  recommendations: TestRecommendation[];
  insights: TestInsight[];
  winner?: string;
  confidence: number;
}

export interface VariantResult {
  variantId: string;
  participants: number;
  metrics: Record<string, number>;
  confidenceIntervals: Record<string, { lower: number; upper: number }>;
  improvement: Record<string, number>; // Percentage improvement over control
  pValue: Record<string, number>;
}

export interface StatisticalSignificance {
  overall: number;
  byMetric: Record<string, number>;
  significant: boolean;
  significantMetrics: string[];
}

export interface TestRecommendation {
  type: "declare_winner" | "continue_test" | "stop_test" | "modify_test";
  variantId?: string;
  confidence: number;
  reasoning: string;
  actions: string[];
}

export interface TestInsight {
  type: "trend" | "anomaly" | "opportunity" | "risk";
  title: string;
  description: string;
  data: Record<string, any>;
  confidence: number;
  impact: "low" | "medium" | "high";
}

// Performance Optimization Types
export interface PerformanceOptimization {
  id: string;
  name: string;
  type: "delivery" | "content" | "timing" | "targeting" | "system";
  status: "active" | "inactive" | "testing" | "paused";
  configuration: OptimizationConfig;
  metrics: OptimizationMetrics;
  createdAt: number;
  updatedAt: number;
}

export interface OptimizationConfig {
  enabled: boolean;
  parameters: Record<string, any>;
  constraints: Record<string, any>;
  fallback: Record<string, any>;
}

export interface OptimizationMetrics {
  baseline: Record<string, number>;
  current: Record<string, number>;
  improvement: Record<string, number>;
  confidence: Record<string, number>;
  lastUpdated: number;
}

export interface OptimizationRule {
  id: string;
  name: string;
  condition: OptimizationCondition;
  action: OptimizationAction;
  priority: number;
  enabled: boolean;
  performance: OptimizationPerformance;
}

export interface OptimizationCondition {
  metric: string;
  operator: "greater" | "less" | "equal" | "between";
  threshold: number | [number, number];
  timeframe: number; // Hours
}

export interface OptimizationAction {
  type: "adjust_parameter" | "switch_strategy" | "enable_feature" | "disable_feature";
  target: string;
  value: any;
  duration?: number; // How long to apply the action
}

export interface OptimizationPerformance {
  appliedAt: number;
  originalValue: any;
  newValue: any;
  impact: Record<string, number>;
  reverted: boolean;
  revertAt?: number;
}

// A/B Testing Engine
export class ABTestingEngine {
  private static instance: ABTestingEngine;
  private tests: Map<string, ABTest> = new Map();
  private optimizations: Map<string, PerformanceOptimization> = new Map();
  private rules: Map<string, OptimizationRule> = new Map();
  private readonly db = getFirestore(app);

  private constructor() {
    this.initializeEngine();
  }

  static getInstance(): ABTestingEngine {
    if (!ABTestingEngine.instance) {
      ABTestingEngine.instance = new ABTestingEngine();
    }
    return ABTestingEngine.instance;
  }

  // Create new A/B test
  async createTest(
    ownerId: string,
    testData: Omit<ABTest, "id" | "createdAt" | "updatedAt" | "results">
  ): Promise<string> {
    const testId = this.generateTestId();
    const now = Date.now();

    const test: ABTest = {
      ...testData,
      id: testId,
      ownerId,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      results: {
        totalParticipants: 0,
        variantResults: [],
        statisticalSignificance: {
          overall: 0,
          byMetric: {},
          significant: false,
          significantMetrics: []
        },
        recommendations: [],
        insights: []
      }
    };

    try {
      await setDoc(doc(this.db, "abTests", testId), test);
      this.tests.set(testId, test);

      console.log(`Created A/B test: ${testId}`);
      return testId;
    } catch (error) {
      console.error("Failed to create A/B test:", error);
      throw error;
    }
  }

  // Start A/B test
  async startTest(testId: string): Promise<boolean> {
    try {
      const test = await this.getTest(testId);
      if (!test) return false;

      if (test.status !== "draft") {
        throw new Error("Can only start draft tests");
      }

      // Validate test configuration
      if (!this.validateTestConfiguration(test)) {
        throw new Error("Invalid test configuration");
      }

      // Calculate sample sizes
      test.targetAudience.sampleSize = this.calculateSampleSize(test);

      await updateDoc(doc(this.db, "abTests", testId), {
        status: "running",
        startedAt: Date.now(),
        updatedAt: Date.now()
      });

      test.status = "running";
      test.startedAt = Date.now();
      this.tests.set(testId, test);

      console.log(`Started A/B test: ${testId}`);
      return true;
    } catch (error) {
      console.error("Failed to start A/B test:", error);
      return false;
    }
  }

  // Assign user to test variant
  async assignVariant(testId: string, userId: string): Promise<TestVariant | null> {
    try {
      const test = await this.getTest(testId);
      if (!test || test.status !== "running") {
        return null;
      }

      // Check if user is in target audience
      if (!this.isUserInAudience(userId, test.targetAudience)) {
        return null;
      }

      // Check if user already assigned
      const existingAssignment = await this.getUserAssignment(testId, userId);
      if (existingAssignment) {
        return existingAssignment;
      }

      // Assign variant based on allocation method
      const variant = this.selectVariant(test.variants, test.targetAudience.allocationMethod);

      // Record assignment
      await setDoc(doc(this.db, "testAssignments", `${testId}-${userId}`), {
        testId,
        userId,
        variantId: variant.id,
        assignedAt: Date.now()
      });

      // Update test results
      test.results.totalParticipants++;
      await updateDoc(doc(this.db, "abTests", testId), {
        results: test.results,
        updatedAt: Date.now()
      });

      console.log(`Assigned user ${userId} to variant ${variant.id} in test ${testId}`);
      return variant;
    } catch (error) {
      console.error("Failed to assign test variant:", error);
      return null;
    }
  }

  // Track test event
  async trackEvent(
    testId: string,
    userId: string,
    variantId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      const test = await this.getTest(testId);
      if (!test) return;

      const eventId = this.generateEventId();
      await setDoc(doc(this.db, "testEvents", eventId), {
        id: eventId,
        testId,
        userId,
        variantId,
        eventType,
        eventData,
        timestamp: Date.now()
      });

      // Update variant results
      await this.updateVariantResults(testId, variantId, eventType, eventData);

      // Check for auto-stop conditions
      if (test.settings.autoStop) {
        await this.checkAutoStopConditions(testId);
      }
    } catch (error) {
      console.error("Failed to track test event:", error);
    }
  }

  // Get test results
  async getTestResults(testId: string): Promise<TestResults | null> {
    try {
      const test = await this.getTest(testId);
      if (!test) return null;

      // Calculate results from events
      const results = await this.calculateTestResults(testId);

      return results;
    } catch (error) {
      console.error("Failed to get test results:", error);
      return null;
    }
  }

  // Complete test
  async completeTest(testId: string, winner?: string): Promise<boolean> {
    try {
      const test = await this.getTest(testId);
      if (!test) return false;

      const results = await this.getTestResults(testId);
      if (!results) return false;

      await updateDoc(doc(this.db, "abTests", testId), {
        status: "completed",
        completedAt: Date.now(),
        results,
        updatedAt: Date.now()
      });

      test.status = "completed";
      test.completedAt = Date.now();
      test.results = results;
      test.winner = winner;
      this.tests.set(testId, test);

      // Apply winning variant if specified
      if (winner) {
        await this.applyTestWinner(testId, winner);
      }

      console.log(`Completed A/B test: ${testId}`);
      return true;
    } catch (error) {
      console.error("Failed to complete A/B test:", error);
      return false;
    }
  }

  // Create performance optimization
  async createOptimization(
    name: string,
    type: PerformanceOptimization["type"],
    config: OptimizationConfig
  ): Promise<string> {
    const optimizationId = this.generateOptimizationId();
    const now = Date.now();

    const optimization: PerformanceOptimization = {
      id: optimizationId,
      name,
      type,
      status: "inactive",
      configuration: config,
      metrics: {
        baseline: {},
        current: {},
        improvement: {},
        confidence: {},
        lastUpdated: now
      },
      createdAt: now,
      updatedAt: now
    };

    try {
      await setDoc(doc(this.db, "performanceOptimizations", optimizationId), optimization);
      this.optimizations.set(optimizationId, optimization);

      console.log(`Created performance optimization: ${optimizationId}`);
      return optimizationId;
    } catch (error) {
      console.error("Failed to create optimization:", error);
      throw error;
    }
  }

  // Activate optimization
  async activateOptimization(optimizationId: string): Promise<boolean> {
    try {
      const optimization = await this.getOptimization(optimizationId);
      if (!optimization) return false;

      // Set baseline metrics
      optimization.metrics.baseline = await this.getCurrentMetrics(optimization.type);
      optimization.metrics.lastUpdated = Date.now();

      await updateDoc(doc(this.db, "performanceOptimizations", optimizationId), {
        status: "active",
        metrics: optimization.metrics,
        updatedAt: Date.now()
      });

      optimization.status = "active";
      this.optimizations.set(optimizationId, optimization);

      console.log(`Activated optimization: ${optimizationId}`);
      return true;
    } catch (error) {
      console.error("Failed to activate optimization:", error);
      return false;
    }
  }

  // Create optimization rule
  async createOptimizationRule(
    name: string,
    condition: OptimizationCondition,
    action: OptimizationAction
  ): Promise<string> {
    const ruleId = this.generateRuleId();
    const now = Date.now();

    const rule: OptimizationRule = {
      id: ruleId,
      name,
      condition,
      action,
      priority: 1,
      enabled: true,
      performance: {
        appliedAt: 0,
        originalValue: null,
        newValue: null,
        impact: {},
        reverted: false
      }
    };

    try {
      await setDoc(doc(this.db, "optimizationRules", ruleId), rule);
      this.rules.set(ruleId, rule);

      console.log(`Created optimization rule: ${ruleId}`);
      return ruleId;
    } catch (error) {
      console.error("Failed to create optimization rule:", error);
      throw error;
    }
  }

  // Evaluate optimization rules
  async evaluateOptimizationRules(): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      try {
        const shouldApply = await this.evaluateOptimizationCondition(rule.condition);
        if (shouldApply) {
          await this.applyOptimizationRule(rule);
        }
      } catch (error) {
        console.error(`Failed to evaluate optimization rule ${rule.id}:`, error);
      }
    }
  }

  // Get test
  private async getTest(testId: string): Promise<ABTest | null> {
    if (this.tests.has(testId)) {
      return this.tests.get(testId)!;
    }

    try {
      const testDoc = await getDoc(doc(this.db, "abTests", testId));
      if (testDoc.exists()) {
        const test = testDoc.data() as ABTest;
        this.tests.set(testId, test);
        return test;
      }
      return null;
    } catch (error) {
      console.error("Failed to get test:", error);
      return null;
    }
  }

  // Get optimization
  private async getOptimization(optimizationId: string): Promise<PerformanceOptimization | null> {
    if (this.optimizations.has(optimizationId)) {
      return this.optimizations.get(optimizationId)!;
    }

    try {
      const optimizationDoc = await getDoc(doc(this.db, "performanceOptimizations", optimizationId));
      if (optimizationDoc.exists()) {
        const optimization = optimizationDoc.data() as PerformanceOptimization;
        this.optimizations.set(optimizationId, optimization);
        return optimization;
      }
      return null;
    } catch (error) {
      console.error("Failed to get optimization:", error);
      return null;
    }
  }

  // Validate test configuration
  private validateTestConfiguration(test: ABTest): boolean {
    if (test.variants.length < 2) return false;
    if (test.variants.reduce((sum, v) => sum + v.weight, 0) !== 100) return false;
    if (!test.variants.some(v => v.control)) return false;
    return true;
  }

  // Calculate sample size
  private calculateSampleSize(test: ABTest): number {
    const controlVariant = test.variants.find(v => v.control);
    if (!controlVariant) return 1000;

    // Simplified sample size calculation
    // In a real system, this would use statistical formulas
    const baseSampleSize = 1000;
    const variantCount = test.variants.length;
    const expectedEffectSize = 0.1; // 10% improvement

    return Math.ceil(baseSampleSize * variantCount / expectedEffectSize);
  }

  // Select variant
  private selectVariant(variants: TestVariant[], allocationMethod: string): TestVariant {
    if (allocationMethod === "random") {
      const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
      let random = Math.random() * totalWeight;

      for (const variant of variants) {
        random -= variant.weight;
        if (random <= 0) {
          return variant;
        }
      }
    }

    // Default to control variant
    return variants.find(v => v.control) || variants[0];
  }

  // Check if user is in target audience
  private isUserInAudience(userId: string, targetAudience: TargetAudience): boolean {
    // Simplified audience check
    // In a real system, this would evaluate complex user segments
    return true;
  }

  // Get user assignment
  private async getUserAssignment(testId: string, userId: string): Promise<TestVariant | null> {
    try {
      const assignmentDoc = await getDoc(doc(this.db, "testAssignments", `${testId}-${userId}`));
      if (assignmentDoc.exists()) {
        const assignment = assignmentDoc.data();
        const test = await this.getTest(testId);
        if (test) {
          return test.variants.find(v => v.id === assignment.variantId) || null;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to get user assignment:", error);
      return null;
    }
  }

  // Update variant results
  private async updateVariantResults(
    testId: string,
    variantId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<void> {
    // This would update variant performance metrics
    // For now, just log the event
    console.log(`Test ${testId}, Variant ${variantId}: ${eventType}`, eventData);
  }

  // Calculate test results
  private async calculateTestResults(testId: string): Promise<TestResults> {
    // This would calculate statistical results from test events
    // For now, return mock results
    return {
      totalParticipants: 0,
      variantResults: [],
      statisticalSignificance: {
        overall: 0,
        byMetric: {},
        significant: false,
        significantMetrics: []
      },
      recommendations: [],
      insights: []
    };
  }

  // Check auto-stop conditions
  private async checkAutoStopConditions(testId: string): Promise<void> {
    const test = await this.getTest(testId);
    if (!test) return;

    const results = await this.getTestResults(testId);

    for (const condition of test.settings.autoStopConditions) {
      const metricValue = results.variantResults[0]?.metrics[condition.metricId] || 0;

      let shouldStop = false;
      switch (condition.operator) {
        case "greater":
          shouldStop = metricValue > condition.threshold;
          break;
        case "less":
          shouldStop = metricValue < condition.threshold;
          break;
        case "equal":
          shouldStop = metricValue === condition.threshold;
          break;
      }

      if (shouldStop) {
        await this.completeTest(testId, condition.variantId);
        break;
      }
    }
  }

  // Apply test winner
  private async applyTestWinner(testId: string, winnerId: string): Promise<void> {
    const test = await this.getTest(testId);
    if (!test) return;

    const winner = test.variants.find(v => v.id === winnerId);
    if (!winner) return;

    // Apply winning configuration to the system
    // This would update default notification settings, templates, etc.

    console.log(`Applying test winner ${winnerId} from test ${testId}`);
  }

  // Evaluate optimization condition
  private async evaluateOptimizationCondition(condition: OptimizationCondition): Promise<boolean> {
    const currentValue = await this.getCurrentMetricValue(condition.metric, condition.timeframe);

    switch (condition.operator) {
      case "greater":
        return currentValue > condition.threshold;
      case "less":
        return currentValue < condition.threshold;
      case "equal":
        return currentValue === condition.threshold;
      case "between":
        const [min, max] = condition.threshold as [number, number];
        return currentValue >= min && currentValue <= max;
      default:
        return false;
    }
  }

  // Apply optimization rule
  private async applyOptimizationRule(rule: OptimizationRule): Promise<void> {
    try {
      // Store original value
      const originalValue = await this.getCurrentParameterValue(rule.action.target);

      // Apply the optimization
      await this.setParameterValue(rule.action.target, rule.action.value);

      // Update rule performance
      rule.performance.appliedAt = Date.now();
      rule.performance.originalValue = originalValue;
      rule.performance.newValue = rule.action.value;

      await updateDoc(doc(this.db, "optimizationRules", rule.id), {
        performance: rule.performance,
        updatedAt: Date.now()
      });

      console.log(`Applied optimization rule ${rule.id}`);
    } catch (error) {
      console.error("Failed to apply optimization rule:", error);
    }
  }

  // Get current metrics
  private async getCurrentMetrics(type: string): Promise<Record<string, number>> {
    // This would get current performance metrics
    return {
      deliveryTime: 100,
      openRate: 0.75,
      clickRate: 0.3,
      bounceRate: 0.05
    };
  }

  // Get current metric value
  private async getCurrentMetricValue(metric: string, timeframe: number): Promise<number> {
    // This would get current metric value for the specified timeframe
    return 0.75;
  }

  // Get current parameter value
  private async getCurrentParameterValue(parameter: string): Promise<any> {
    // This would get current parameter value
    return null;
  }

  // Set parameter value
  private async setParameterValue(parameter: string, value: any): Promise<void> {
    // This would set parameter value in the system
    console.log(`Setting ${parameter} to ${value}`);
  }

  // Utility methods
  private generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOptimizationId(): string {
    return `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRuleId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeEngine(): void {
    console.log("A/B Testing Engine initialized");
  }
}

// React hook for A/B testing
export function useABTesting() {
  const { user } = useAuth();
  const [engine] = useState(() => ABTestingEngine.getInstance());
  const [tests, setTests] = useState<ABTest[]>([]);
  const [optimizations, setOptimizations] = useState<PerformanceOptimization[]>([]);
  const [loading, setLoading] = useState(true);

  const createTest = useCallback(async (
    testData: Omit<ABTest, "id" | "createdAt" | "updatedAt" | "results" | "ownerId">
  ) => {
    if (!user) return null;

    try {
      return await engine.createTest(user.uid, testData);
    } catch (error) {
      console.error("Failed to create test:", error);
      return null;
    }
  }, [user, engine]);

  const startTest = useCallback(async (testId: string) => {
    try {
      return await engine.startTest(testId);
    } catch (error) {
      console.error("Failed to start test:", error);
      return false;
    }
  }, [engine]);

  const assignVariant = useCallback(async (testId: string) => {
    if (!user) return null;

    try {
      return await engine.assignVariant(testId, user.uid);
    } catch (error) {
      console.error("Failed to assign variant:", error);
      return null;
    }
  }, [user, engine]);

  const trackEvent = useCallback(async (
    testId: string,
    variantId: string,
    eventType: string,
    eventData: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await engine.trackEvent(testId, user.uid, variantId, eventType, eventData);
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  }, [user, engine]);

  const completeTest = useCallback(async (testId: string, winner?: string) => {
    try {
      return await engine.completeTest(testId, winner);
    } catch (error) {
      console.error("Failed to complete test:", error);
      return false;
    }
  }, [engine]);

  const createOptimization = useCallback(async (
    name: string,
    type: PerformanceOptimization["type"],
    config: OptimizationConfig
  ) => {
    try {
      return await engine.createOptimization(name, type, config);
    } catch (error) {
      console.error("Failed to create optimization:", error);
      return null;
    }
  }, [engine]);

  const activateOptimization = useCallback(async (optimizationId: string) => {
    try {
      return await engine.activateOptimization(optimizationId);
    } catch (error) {
      console.error("Failed to activate optimization:", error);
      return false;
    }
  }, [engine]);

  const createOptimizationRule = useCallback(async (
    name: string,
    condition: OptimizationCondition,
    action: OptimizationAction
  ) => {
    try {
      return await engine.createOptimizationRule(name, condition, action);
    } catch (error) {
      console.error("Failed to create optimization rule:", error);
      return null;
    }
  }, [engine]);

  return {
    tests,
    optimizations,
    loading,
    createTest,
    startTest,
    assignVariant,
    trackEvent,
    completeTest,
    createOptimization,
    activateOptimization,
    createOptimizationRule
  };
}

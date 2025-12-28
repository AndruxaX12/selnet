import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getFirestore } from "firebase/firestore";
import { PushNotificationPayload } from "./pushManager";
import { NotificationScheduler } from "./scheduler";
import { SmartFilterEngine } from "./smartFiltering";

const db = getFirestore(app);

// Automation Workflow Types
export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  settings: WorkflowSettings;
  statistics: WorkflowStatistics;
  createdAt: number;
  updatedAt: number;
  lastExecuted?: number;
  metadata: Record<string, any>;
}

export interface WorkflowTrigger {
  type: "event" | "schedule" | "condition" | "manual" | "api";
  eventType?: string;
  schedule?: ScheduleConfig;
  condition?: TriggerCondition;
  config: Record<string, any>;
}

export interface ScheduleConfig {
  type: "once" | "recurring" | "cron";
  cronExpression?: string;
  interval?: number; // minutes
  startDate?: number;
  endDate?: number;
  timezone: string;
}

export interface TriggerCondition {
  field: string;
  operator: "equals" | "contains" | "greater" | "less" | "exists";
  value: any;
}

export interface WorkflowCondition {
  id: string;
  type: "filter" | "logical" | "time" | "user" | "custom";
  operator: "AND" | "OR" | "NOT";
  leftOperand: ConditionOperand;
  rightOperand: ConditionOperand;
  metadata: Record<string, any>;
}

export interface ConditionOperand {
  type: "value" | "variable" | "function" | "field";
  value: any;
  field?: string;
  function?: string;
}

export interface WorkflowAction {
  id: string;
  type: "send" | "modify" | "delay" | "cancel" | "escalate" | "group" | "archive" | "custom";
  config: Record<string, any>;
  order: number;
  conditions: WorkflowCondition[];
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: "linear" | "exponential" | "fixed";
  initialDelay: number;
  maxDelay: number;
}

export interface WorkflowSettings {
  priority: "low" | "normal" | "high" | "urgent";
  maxExecutions: number;
  rateLimit: number; // per hour
  timeout: number; // seconds
  continueOnError: boolean;
  loggingLevel: "none" | "basic" | "detailed";
  notifications: {
    onSuccess: boolean;
    onError: boolean;
    onTimeout: boolean;
  };
}

export interface WorkflowStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime?: number;
  executionHistory: ExecutionRecord[];
}

export interface ExecutionRecord {
  id: string;
  timestamp: number;
  duration: number;
  status: "success" | "error" | "timeout";
  input: Record<string, any>;
  output: Record<string, any>;
  error?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  priority: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// Automation Workflow Engine
export class AutomationWorkflowEngine {
  private static instance: AutomationWorkflowEngine;
  private workflows: Map<string, AutomationWorkflow> = new Map();
  private rules: Map<string, AutomationRule> = new Map();
  private executions: Map<string, ExecutionRecord[]> = new Map();
  private readonly db = getFirestore(app);

  private constructor() {
    this.initializeEngine();
  }

  static getInstance(): AutomationWorkflowEngine {
    if (!AutomationWorkflowEngine.instance) {
      AutomationWorkflowEngine.instance = new AutomationWorkflowEngine();
    }
    return AutomationWorkflowEngine.instance;
  }

  // Create new workflow
  async createWorkflow(
    ownerId: string,
    workflowData: Omit<AutomationWorkflow, "id" | "createdAt" | "updatedAt" | "statistics">
  ): Promise<string> {
    const workflowId = this.generateWorkflowId();
    const now = Date.now();

    const workflow: AutomationWorkflow = {
      ...workflowData,
      id: workflowId,
      ownerId,
      createdAt: now,
      updatedAt: now,
      statistics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        executionHistory: []
      }
    };

    try {
      await setDoc(doc(this.db, "automationWorkflows", workflowId), workflow);
      this.workflows.set(workflowId, workflow);

      console.log(`Created automation workflow: ${workflowId}`);
      return workflowId;
    } catch (error) {
      console.error("Failed to create workflow:", error);
      throw error;
    }
  }

  // Execute workflow
  async executeWorkflow(workflowId: string, context: Record<string, any>): Promise<ExecutionResult> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow || !workflow.enabled) {
        throw new Error("Workflow not found or disabled");
      }

      const startTime = Date.now();
      const executionId = this.generateExecutionId();

      // Check rate limit
      if (this.isRateLimited(workflow, startTime)) {
        throw new Error("Rate limit exceeded");
      }

      // Evaluate trigger
      if (!this.evaluateTrigger(workflow.trigger, context)) {
        return {
          executionId,
          workflowId,
          status: "skipped",
          reason: "Trigger conditions not met",
          duration: Date.now() - startTime
        };
      }

      // Evaluate conditions
      if (!this.evaluateConditions(workflow.conditions, context)) {
        return {
          executionId,
          workflowId,
          status: "skipped",
          reason: "Workflow conditions not met",
          duration: Date.now() - startTime
        };
      }

      // Execute actions
      const results = await this.executeActions(workflow.actions, context, workflow.settings);

      const duration = Date.now() - startTime;
      const executionRecord: ExecutionRecord = {
        id: executionId,
        timestamp: startTime,
        duration,
        status: results.success ? "success" : "error",
        input: context,
        output: results.output,
        error: results.error
      };

      // Update workflow statistics
      await this.updateWorkflowStatistics(workflowId, executionRecord);

      const result: ExecutionResult = {
        executionId,
        workflowId,
        status: executionRecord.status,
        reason: executionRecord.status === "success" ? "Completed successfully" : (results.error || "Execution failed"),
        duration,
        output: results.output
      };

      return result;
    } catch (error) {
      console.error("Workflow execution failed:", error);
      throw error;
    }
  }

  // Create automation rule
  async createRule(
    ownerId: string,
    ruleData: Omit<AutomationRule, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const ruleId = this.generateRuleId();
    const now = Date.now();

    const rule: AutomationRule = {
      ...ruleData,
      id: ruleId,
      createdAt: now,
      updatedAt: now
    };

    try {
      await setDoc(doc(this.db, "automationRules", ruleId), rule);
      this.rules.set(ruleId, rule);

      console.log(`Created automation rule: ${ruleId}`);
      return ruleId;
    } catch (error) {
      console.error("Failed to create rule:", error);
      throw error;
    }
  }

  // Evaluate and execute rules
  async evaluateRules(context: Record<string, any>): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      try {
        // Evaluate trigger
        if (!this.evaluateTrigger(rule.trigger, context)) {
          continue;
        }

        // Evaluate conditions
        if (!this.evaluateConditions(rule.conditions, context)) {
          continue;
        }

        // Execute actions
        const actionResults = await this.executeActions(rule.actions, context, {
          priority: "normal",
          maxExecutions: 1,
          rateLimit: 60,
          timeout: 30,
          continueOnError: false,
          loggingLevel: "basic",
          notifications: { onSuccess: false, onError: false, onTimeout: false }
        });

        const result: ExecutionResult = {
          executionId: this.generateExecutionId(),
          workflowId: rule.id,
          status: actionResults.success ? "success" : "error",
          reason: actionResults.success ? "Rule executed successfully" : (actionResults.error || "Rule execution failed"),
          duration: 0,
          output: actionResults.output
        };

        results.push(result);
      } catch (error) {
        console.error(`Rule ${rule.id} execution failed:`, error);
      }
    }

    return results;
  }

  // Evaluate trigger
  private evaluateTrigger(trigger: WorkflowTrigger, context: Record<string, any>): boolean {
    switch (trigger.type) {
      case "event":
        return this.evaluateEventTrigger(trigger, context);
      case "schedule":
        return this.evaluateScheduleTrigger(trigger, context);
      case "condition":
        return this.evaluateConditionTrigger(trigger, context);
      case "manual":
        return true; // Manual triggers are always true
      case "api":
        return this.evaluateApiTrigger(trigger, context);
      default:
        return false;
    }
  }

  // Evaluate event trigger
  private evaluateEventTrigger(trigger: WorkflowTrigger, context: Record<string, any>): boolean {
    if (!trigger.eventType) return false;

    const eventType = context.eventType || context.type;
    return eventType === trigger.eventType;
  }

  // Evaluate schedule trigger
  private evaluateScheduleTrigger(trigger: WorkflowTrigger, context: Record<string, any>): boolean {
    if (!trigger.schedule) return false;

    const now = Date.now();
    const schedule = trigger.schedule;

    switch (schedule.type) {
      case "once":
        return schedule.startDate ? now >= schedule.startDate : false;
      case "recurring":
        return this.isRecurringTimeMatch(now, schedule);
      case "cron":
        return schedule.cronExpression ? this.evaluateCronExpression(now, schedule.cronExpression) : false;
      default:
        return false;
    }
  }

  // Evaluate condition trigger
  private evaluateConditionTrigger(trigger: WorkflowTrigger, context: Record<string, any>): boolean {
    if (!trigger.condition) return true;

    return this.evaluateSingleCondition(trigger.condition, context);
  }

  // Evaluate API trigger
  private evaluateApiTrigger(trigger: WorkflowTrigger, context: Record<string, any>): boolean {
    // API triggers are validated by authentication/authorization
    return context.apiTrigger === true;
  }

  // Evaluate workflow conditions
  private evaluateConditions(conditions: WorkflowCondition[], context: Record<string, any>): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => this.evaluateSingleCondition(condition, context));
  }

  // Evaluate single condition
  private evaluateSingleCondition(condition: WorkflowCondition | TriggerCondition, context: Record<string, any>): boolean {
    const leftValue = this.resolveOperand(condition.leftOperand, context);
    const rightValue = this.resolveOperand(condition.rightOperand, context);

    switch (condition.operator) {
      case "AND":
        return this.evaluateConditions(condition.conditions || [], context);
      case "OR":
        return condition.conditions?.some(c => this.evaluateSingleCondition(c, context)) || false;
      case "NOT":
        return !this.evaluateSingleCondition(condition.conditions?.[0] || condition, context);
      case "equals":
        return leftValue === rightValue;
      case "contains":
        return String(leftValue).includes(String(rightValue));
      case "greater":
        return Number(leftValue) > Number(rightValue);
      case "less":
        return Number(leftValue) < Number(rightValue);
      case "exists":
        return leftValue !== undefined && leftValue !== null;
      default:
        return false;
    }
  }

  // Resolve operand value
  private resolveOperand(operand: ConditionOperand, context: Record<string, any>): any {
    switch (operand.type) {
      case "value":
        return operand.value;
      case "variable":
        return context[operand.value] || operand.value;
      case "field":
        return operand.field ? context[operand.field] : operand.value;
      case "function":
        return this.executeFunction(operand.function || "", operand.value, context);
      default:
        return operand.value;
    }
  }

  // Execute function
  private executeFunction(functionName: string, parameters: any, context: Record<string, any>): any {
    // Simple function execution - in a real system this would be more sophisticated
    switch (functionName) {
      case "now":
        return Date.now();
      case "dayOfWeek":
        return new Date().getDay();
      case "hourOfDay":
        return new Date().getHours();
      case "userExists":
        return context.userId !== undefined;
      case "hasRole":
        return context.userRoles?.includes(parameters);
      default:
        return null;
    }
  }

  // Execute workflow actions
  private async executeActions(
    actions: WorkflowAction[],
    context: Record<string, any>,
    settings: WorkflowSettings
  ): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    const output: Record<string, any> = {};
    let success = true;
    let error: string | undefined;

    // Sort actions by order
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      try {
        // Check action conditions
        if (action.conditions.length > 0 && !this.evaluateConditions(action.conditions, context)) {
          continue; // Skip action if conditions not met
        }

        const result = await this.executeSingleAction(action, context, settings);
        Object.assign(output, result.output);

        if (!result.success && !settings.continueOnError) {
          success = false;
          error = result.error;
          break;
        }
      } catch (err) {
        if (!settings.continueOnError) {
          success = false;
          error = err instanceof Error ? err.message : "Unknown error";
          break;
        }
      }
    }

    return { success, output, error };
  }

  // Execute single action
  private async executeSingleAction(
    action: WorkflowAction,
    context: Record<string, any>,
    settings: WorkflowSettings
  ): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    switch (action.type) {
      case "send":
        return await this.executeSendAction(action, context);
      case "modify":
        return await this.executeModifyAction(action, context);
      case "delay":
        return await this.executeDelayAction(action, context);
      case "cancel":
        return await this.executeCancelAction(action, context);
      case "escalate":
        return await this.executeEscalateAction(action, context);
      case "group":
        return await this.executeGroupAction(action, context);
      case "archive":
        return await this.executeArchiveAction(action, context);
      case "custom":
        return await this.executeCustomAction(action, context);
      default:
        return { success: false, output: {}, error: "Unknown action type" };
    }
  }

  // Execute send action
  private async executeSendAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    try {
      const notification = context.notification || action.config.notification;
      if (!notification) {
        return { success: false, output: {}, error: "No notification to send" };
      }

      // Send notification using the notification system
      // This would integrate with the main notification system

      return { success: true, output: { sent: true, notificationId: notification.id } };
    } catch (error) {
      return { success: false, output: {}, error: error instanceof Error ? error.message : "Send failed" };
    }
  }

  // Execute modify action
  private async executeModifyAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    try {
      const notification = context.notification;
      if (!notification) {
        return { success: false, output: {}, error: "No notification to modify" };
      }

      // Apply modifications
      const modifications = action.config.modifications || {};
      const modifiedNotification = { ...notification, ...modifications };

      return { success: true, output: { modified: true, notification: modifiedNotification } };
    } catch (error) {
      return { success: false, output: {}, error: error instanceof Error ? error.message : "Modify failed" };
    }
  }

  // Execute delay action
  private async executeDelayAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    try {
      const delay = action.config.delay || 0;
      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      return { success: true, output: { delayed: true, delayDuration: delay } };
    } catch (error) {
      return { success: false, output: {}, error: error instanceof Error ? error.message : "Delay failed" };
    }
  }

  // Execute cancel action
  private async executeCancelAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    try {
      const notification = context.notification;
      if (!notification) {
        return { success: false, output: {}, error: "No notification to cancel" };
      }

      // Cancel notification
      // This would integrate with the notification scheduler

      return { success: true, output: { cancelled: true } };
    } catch (error) {
      return { success: false, output: {}, error: error instanceof Error ? error.message : "Cancel failed" };
    }
  }

  // Execute escalate action
  private async executeEscalateAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    try {
      const notification = context.notification;
      if (!notification) {
        return { success: false, output: {}, error: "No notification to escalate" };
      }

      // Escalate priority
      const escalation = action.config.escalation || {};
      const escalatedNotification = {
        ...notification,
        priority: escalation.priority || "high",
        ...escalation.additionalChannels && { channels: escalation.additionalChannels }
      };

      return { success: true, output: { escalated: true, notification: escalatedNotification } };
    } catch (error) {
      return { success: false, output: {}, error: error instanceof Error ? error.message : "Escalate failed" };
    }
  }

  // Execute group action
  private async executeGroupAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    try {
      const groupBy = action.config.groupBy || "channel";
      const groupValue = context[groupBy];

      return { success: true, output: { grouped: true, groupBy, groupValue } };
    } catch (error) {
      return { success: false, output: {}, error: error instanceof Error ? error.message : "Group failed" };
    }
  }

  // Execute archive action
  private async executeArchiveAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    try {
      const notification = context.notification;
      if (!notification) {
        return { success: false, output: {}, error: "No notification to archive" };
      }

      // Archive notification
      // This would move to archive storage

      return { success: true, output: { archived: true } };
    } catch (error) {
      return { success: false, output: {}, error: error instanceof Error ? error.message : "Archive failed" };
    }
  }

  // Execute custom action
  private async executeCustomAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    try {
      const customFunction = action.config.function;
      if (!customFunction) {
        return { success: false, output: {}, error: "No custom function specified" };
      }

      // Execute custom function
      // This would be a user-defined function

      return { success: true, output: { customExecuted: true } };
    } catch (error) {
      return { success: false, output: {}, error: error instanceof Error ? error.message : "Custom action failed" };
    }
  }

  // Utility methods
  private isRecurringTimeMatch(currentTime: number, schedule: ScheduleConfig): boolean {
    if (!schedule.interval) return false;

    const lastExecution = schedule.startDate || 0;
    const elapsed = currentTime - lastExecution;
    return elapsed >= (schedule.interval * 60 * 1000);
  }

  private evaluateCronExpression(currentTime: number, cronExpression: string): boolean {
    // Simplified cron evaluation - in a real system this would be more sophisticated
    const [minutes, hours, days, months, daysOfWeek] = cronExpression.split(' ');

    const date = new Date(currentTime);
    const currentMinutes = date.getMinutes().toString();
    const currentHours = date.getHours().toString();
    const currentDays = date.getDate().toString();
    const currentMonths = (date.getMonth() + 1).toString();
    const currentDaysOfWeek = date.getDay().toString();

    return (minutes === '*' || minutes === currentMinutes) &&
           (hours === '*' || hours === currentHours) &&
           (days === '*' || days === currentDays) &&
           (months === '*' || months === currentMonths) &&
           (daysOfWeek === '*' || daysOfWeek === currentDaysOfWeek);
  }

  private isRateLimited(workflow: AutomationWorkflow, currentTime: number): boolean {
    const rateLimit = workflow.settings.rateLimit;
    const recentExecutions = workflow.statistics.executionHistory.filter(
      e => currentTime - e.timestamp < 60 * 60 * 1000 // Last hour
    );

    return recentExecutions.length >= rateLimit;
  }

  private async updateWorkflowStatistics(workflowId: string, execution: ExecutionRecord): Promise<void> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) return;

      workflow.statistics.totalExecutions++;
      if (execution.status === "success") {
        workflow.statistics.successfulExecutions++;
      } else {
        workflow.statistics.failedExecutions++;
      }

      // Update average execution time
      const totalTime = workflow.statistics.averageExecutionTime * (workflow.statistics.totalExecutions - 1) + execution.duration;
      workflow.statistics.averageExecutionTime = totalTime / workflow.statistics.totalExecutions;

      workflow.statistics.lastExecutionTime = execution.timestamp;
      workflow.statistics.executionHistory.unshift(execution);

      // Limit history to last 100 executions
      if (workflow.statistics.executionHistory.length > 100) {
        workflow.statistics.executionHistory = workflow.statistics.executionHistory.slice(0, 100);
      }

      await updateDoc(doc(this.db, "automationWorkflows", workflowId), {
        statistics: workflow.statistics,
        lastExecuted: execution.timestamp,
        updatedAt: Date.now()
      });

      this.workflows.set(workflowId, workflow);
    } catch (error) {
      console.error("Failed to update workflow statistics:", error);
    }
  }

  private async getWorkflow(workflowId: string): Promise<AutomationWorkflow | null> {
    if (this.workflows.has(workflowId)) {
      return this.workflows.get(workflowId)!;
    }

    try {
      const workflowDoc = await getDoc(doc(this.db, "automationWorkflows", workflowId));
      if (workflowDoc.exists()) {
        const workflow = workflowDoc.data() as AutomationWorkflow;
        this.workflows.set(workflowId, workflow);
        return workflow;
      }
      return null;
    } catch (error) {
      console.error("Failed to get workflow:", error);
      return null;
    }
  }

  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRuleId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeEngine(): void {
    // Initialize with default workflows and rules
    console.log("Automation Workflow Engine initialized");
  }
}

// Types for execution results
interface ExecutionResult {
  executionId: string;
  workflowId: string;
  status: "success" | "error" | "timeout" | "skipped";
  reason: string;
  duration: number;
  output: Record<string, any>;
}

// React hook for automation workflows
export function useAutomationWorkflows() {
  const { user } = useAuth();
  const [engine] = useState(() => AutomationWorkflowEngine.getInstance());
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(true);

  const createWorkflow = useCallback(async (
    workflowData: Omit<AutomationWorkflow, "id" | "createdAt" | "updatedAt" | "statistics" | "ownerId">
  ) => {
    if (!user) return null;

    try {
      return await engine.createWorkflow(user.uid, workflowData);
    } catch (error) {
      console.error("Failed to create workflow:", error);
      return null;
    }
  }, [user, engine]);

  const executeWorkflow = useCallback(async (workflowId: string, context: Record<string, any>) => {
    try {
      return await engine.executeWorkflow(workflowId, context);
    } catch (error) {
      console.error("Failed to execute workflow:", error);
      return null;
    }
  }, [engine]);

  const createRule = useCallback(async (
    ruleData: Omit<AutomationRule, "id" | "createdAt" | "updatedAt" | "ownerId">
  ) => {
    if (!user) return null;

    try {
      return await engine.createRule(user.uid, ruleData);
    } catch (error) {
      console.error("Failed to create rule:", error);
      return null;
    }
  }, [user, engine]);

  const evaluateRules = useCallback(async (context: Record<string, any>) => {
    try {
      return await engine.evaluateRules(context);
    } catch (error) {
      console.error("Failed to evaluate rules:", error);
      return [];
    }
  }, [engine]);

  return {
    workflows,
    rules,
    executions,
    loading,
    createWorkflow,
    executeWorkflow,
    createRule,
    evaluateRules
  };
}

import { PushNotificationPayload } from "./pushManager";
import { NotificationTemplateRegistry } from "./templates";

// Notification categories
export enum NotificationCategory {
  SYSTEM = "system",
  SIGNAL = "signal",
  IDEA = "idea",
  EVENT = "event",
  USER = "user",
  ACHIEVEMENT = "achievement",
  REMINDER = "reminder",
  SOCIAL = "social",
  SECURITY = "security",
  MAINTENANCE = "maintenance"
}

// Notification priority levels
export enum NotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent"
}

// Smart filter types
export enum SmartFilterType {
  KEYWORD = "keyword",
  SENDER = "sender",
  CATEGORY = "category",
  PRIORITY = "priority",
  TIME_BASED = "time_based",
  LOCATION_BASED = "location_based",
  BEHAVIOR_BASED = "behavior_based",
  CONTENT_BASED = "content_based",
  SENTIMENT_BASED = "sentiment_based"
}

// Smart filter interface
export interface SmartFilter {
  id: string;
  name: string;
  description: string;
  type: SmartFilterType;
  enabled: boolean;
  conditions: FilterCondition[];
  actions: FilterAction[];
  priority: number; // Higher number = higher priority
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  caseSensitive?: boolean;
}

export interface FilterAction {
  type: FilterActionType;
  value: any;
  description: string;
}

export enum FilterOperator {
  EQUALS = "equals",
  NOT_EQUALS = "not_equals",
  CONTAINS = "contains",
  NOT_CONTAINS = "not_contains",
  STARTS_WITH = "starts_with",
  ENDS_WITH = "ends_with",
  GREATER_THAN = "greater_than",
  LESS_THAN = "less_than",
  IN = "in",
  NOT_IN = "not_in",
  REGEX = "regex",
  EXISTS = "exists",
  NOT_EXISTS = "not_exists"
}

export enum FilterActionType {
  ALLOW = "allow",
  BLOCK = "block",
  DELAY = "delay",
  REDIRECT = "redirect",
  MODIFY_PRIORITY = "modify_priority",
  MODIFY_CONTENT = "modify_content",
  GROUP = "group",
  ARCHIVE = "archive",
  MARK_AS_READ = "mark_as_read"
}

// Notification classifier for automatic categorization
export class NotificationClassifier {
  private static instance: NotificationClassifier;
  private categoryKeywords: Record<string, string[]> = {
    [NotificationCategory.SYSTEM]: ["система", "system", "update", "maintenance", "server", "сървър"],
    [NotificationCategory.SIGNAL]: ["сигнал", "signal", "report", "issue", "problem"],
    [NotificationCategory.IDEA]: ["идея", "idea", "suggestion", "предложение", "proposal"],
    [NotificationCategory.EVENT]: ["събитие", "event", "meeting", " среща", "calendar"],
    [NotificationCategory.USER]: ["mention", "reply", "comment", "споменаване", "отговор"],
    [NotificationCategory.ACHIEVEMENT]: ["achievement", "badge", "постижение", "award", "награда"],
    [NotificationCategory.REMINDER]: ["reminder", "напомняне", "due", "deadline", "краен срок"],
    [NotificationCategory.SOCIAL]: ["friend", "follow", "like", "share", "социален"],
    [NotificationCategory.SECURITY]: ["security", "login", "password", "сигурност", "auth"],
    [NotificationCategory.MAINTENANCE]: ["maintenance", "downtime", "update", "поддръжка"]
  };

  private priorityKeywords: Record<string, string[]> = {
    [NotificationPriority.URGENT]: ["urgent", "emergency", "critical", "спешно", "критично", "авария"],
    [NotificationPriority.HIGH]: ["important", "high", "priority", "важно", "приоритет"],
    [NotificationPriority.NORMAL]: ["normal", "standard", "medium", "нормално", "стандартно"],
    [NotificationPriority.LOW]: ["low", "info", "ниско", "инфо", "информация"]
  };

  private constructor() {}

  static getInstance(): NotificationClassifier {
    if (!NotificationClassifier.instance) {
      NotificationClassifier.instance = new NotificationClassifier();
    }
    return NotificationClassifier.instance;
  }

  // Classify notification automatically
  classify(payload: PushNotificationPayload): {
    category: NotificationCategory;
    priority: NotificationPriority;
    confidence: number;
    tags: string[];
  } {
    const text = `${payload.title} ${payload.body || ""}`.toLowerCase();
    const categoryScores = this.calculateCategoryScores(text);
    const priorityScores = this.calculatePriorityScores(text);

    const topCategory = Object.entries(categoryScores).reduce((a, b) => a[1] > b[1] ? a : b);
    const topPriority = Object.entries(priorityScores).reduce((a, b) => a[1] > b[1] ? a : b);

    const confidence = Math.max(topCategory[1], topPriority[1]);
    const tags = this.extractTags(text);

    return {
      category: topCategory[0] as NotificationCategory,
      priority: topPriority[0] as NotificationPriority,
      confidence,
      tags
    };
  }

  private calculateCategoryScores(text: string): Record<string, number> {
    const scores: Record<string, number> = {};

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(keyword.toLowerCase(), 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length * (keyword.length / 10); // Longer keywords = higher score
        }
      }
      scores[category] = score;
    }

    return scores;
  }

  private calculatePriorityScores(text: string): Record<string, number> {
    const scores: Record<string, number> = {};

    for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(keyword.toLowerCase(), 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length * (keyword.length / 10);
        }
      }
      scores[priority] = score;
    }

    return scores;
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const words = text.toLowerCase().split(/\s+/);

    // Extract potential tags (words that might be hashtags or important terms)
    for (const word of words) {
      if (word.length > 4 && !this.isStopWord(word)) {
        tags.push(word);
      }
    }

    return [...new Set(tags)].slice(0, 5); // Limit to 5 tags
  }

  private isStopWord(word: string): boolean {
    const stopWords = ["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"];
    return stopWords.includes(word.toLowerCase());
  }
}

// Smart Filter Engine
export class SmartFilterEngine {
  private static instance: SmartFilterEngine;
  private filters: SmartFilter[] = [];
  private readonly STORAGE_KEY = "smartNotificationFilters";

  private constructor() {
    this.loadFilters();
  }

  static getInstance(): SmartFilterEngine {
    if (!SmartFilterEngine.instance) {
      SmartFilterEngine.instance = new SmartFilterEngine();
    }
    return SmartFilterEngine.instance;
  }

  // Add a new filter
  addFilter(filter: Omit<SmartFilter, "id" | "createdAt" | "updatedAt">): string {
    const id = this.generateFilterId();
    const now = Date.now();

    const newFilter: SmartFilter = {
      ...filter,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.filters.push(newFilter);
    this.saveFilters();
    this.sortFiltersByPriority();

    return id;
  }

  // Update an existing filter
  updateFilter(filterId: string, updates: Partial<SmartFilter>): boolean {
    const filterIndex = this.filters.findIndex(f => f.id === filterId);

    if (filterIndex === -1) {
      return false;
    }

    this.filters[filterIndex] = {
      ...this.filters[filterIndex],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveFilters();
    this.sortFiltersByPriority();

    return true;
  }

  // Remove a filter
  removeFilter(filterId: string): boolean {
    const initialLength = this.filters.length;
    this.filters = this.filters.filter(f => f.id !== filterId);

    if (this.filters.length < initialLength) {
      this.saveFilters();
      return true;
    }

    return false;
  }

  // Process a notification through all filters
  processNotification(payload: PushNotificationPayload): {
    filteredPayload: PushNotificationPayload;
    appliedFilters: SmartFilter[];
    blocked: boolean;
    modified: boolean;
  } {
    let filteredPayload = { ...payload };
    const appliedFilters: SmartFilter[] = [];
    let blocked = false;
    let modified = false;

    // Sort filters by priority (highest first)
    const sortedFilters = [...this.filters].sort((a, b) => b.priority - a.priority);

    for (const filter of sortedFilters) {
      if (!filter.enabled) continue;

      const result = this.applyFilter(filteredPayload, filter);

      if (result.blocked) {
        blocked = true;
        break;
      }

      if (result.modified) {
        filteredPayload = result.payload;
        appliedFilters.push(filter);
        modified = true;
      }
    }

    return {
      filteredPayload,
      appliedFilters,
      blocked,
      modified
    };
  }

  // Apply a single filter
  private applyFilter(payload: PushNotificationPayload, filter: SmartFilter): {
    payload: PushNotificationPayload;
    blocked: boolean;
    modified: boolean;
  } {
    let blocked = false;
    let modified = false;
    let newPayload = { ...payload };

    // Check all conditions
    const conditionsMet = filter.conditions.every(condition => this.evaluateCondition(newPayload, condition));

    if (conditionsMet) {
      // Apply all actions
      for (const action of filter.actions) {
        const result = this.executeAction(newPayload, action);
        newPayload = result.payload;
        if (result.blocked) blocked = true;
        if (result.modified) modified = true;
      }
    }

    return { payload: newPayload, blocked, modified };
  }

  // Evaluate a filter condition
  private evaluateCondition(payload: PushNotificationPayload, condition: FilterCondition): boolean {
    let fieldValue: any;

    // Extract field value from payload
    switch (condition.field) {
      case "title":
        fieldValue = payload.title;
        break;
      case "body":
        fieldValue = payload.body;
        break;
      case "channel":
        fieldValue = payload.channel;
        break;
      case "priority":
        fieldValue = payload.priority;
        break;
      case "type":
        fieldValue = payload.type;
        break;
      case "category":
        fieldValue = payload.customData?.category;
        break;
      default:
        fieldValue = payload.customData?.[condition.field];
    }

    if (fieldValue === undefined || fieldValue === null) {
      return condition.operator === FilterOperator.NOT_EXISTS;
    }

    // Convert to string for text operations
    const stringValue = String(fieldValue).toLowerCase();
    const compareValue = String(condition.value).toLowerCase();

    switch (condition.operator) {
      case FilterOperator.EQUALS:
        return stringValue === compareValue;
      case FilterOperator.NOT_EQUALS:
        return stringValue !== compareValue;
      case FilterOperator.CONTAINS:
        return stringValue.includes(compareValue);
      case FilterOperator.NOT_CONTAINS:
        return !stringValue.includes(compareValue);
      case FilterOperator.STARTS_WITH:
        return stringValue.startsWith(compareValue);
      case FilterOperator.ENDS_WITH:
        return stringValue.endsWith(compareValue);
      case FilterOperator.REGEX:
        try {
          return new RegExp(compareValue, condition.caseSensitive ? 'g' : 'gi').test(stringValue);
        } catch {
          return false;
        }
      case FilterOperator.EXISTS:
        return true;
      case FilterOperator.NOT_EXISTS:
        return false;
      default:
        return false;
    }
  }

  // Execute a filter action
  private executeAction(payload: PushNotificationPayload, action: FilterAction): {
    payload: PushNotificationPayload;
    blocked: boolean;
    modified: boolean;
  } {
    let blocked = false;
    let modified = false;
    let newPayload = { ...payload };

    switch (action.type) {
      case FilterActionType.ALLOW:
        // Do nothing, just allow
        break;
      case FilterActionType.BLOCK:
        blocked = true;
        break;
      case FilterActionType.DELAY:
        // Add delay to payload (handled by scheduler)
        newPayload.customData = { ...newPayload.customData, delay: action.value };
        modified = true;
        break;
      case FilterActionType.REDIRECT:
        newPayload.url = action.value;
        modified = true;
        break;
      case FilterActionType.MODIFY_PRIORITY:
        newPayload.priority = action.value;
        modified = true;
        break;
      case FilterActionType.MODIFY_CONTENT:
        if (action.value.title) newPayload.title = action.value.title;
        if (action.value.body) newPayload.body = action.value.body;
        modified = true;
        break;
      case FilterActionType.GROUP:
        newPayload.tag = `${newPayload.tag || 'group'}-${action.value}`;
        modified = true;
        break;
      case FilterActionType.ARCHIVE:
        newPayload.customData = { ...newPayload.customData, archived: true };
        modified = true;
        break;
      case FilterActionType.MARK_AS_READ:
        newPayload.customData = { ...newPayload.customData, autoRead: true };
        modified = true;
        break;
    }

    return { payload: newPayload, blocked, modified };
  }

  // Get all filters
  getFilters(): SmartFilter[] {
    return [...this.filters];
  }

  // Get filters by type
  getFiltersByType(type: SmartFilterType): SmartFilter[] {
    return this.filters.filter(f => f.type === type);
  }

  // Enable/disable filter
  toggleFilter(filterId: string, enabled: boolean): boolean {
    return this.updateFilter(filterId, { enabled });
  }

  // Sort filters by priority
  private sortFiltersByPriority() {
    this.filters.sort((a, b) => b.priority - a.priority);
  }

  // Generate unique filter ID
  private generateFilterId(): string {
    return `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save filters to localStorage
  private saveFilters() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.filters));
    } catch (error) {
      console.error("Failed to save smart filters:", error);
    }
  }

  // Load filters from localStorage
  private loadFilters() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.filters = JSON.parse(stored);
        this.sortFiltersByPriority();
      }
    } catch (error) {
      console.error("Failed to load smart filters:", error);
    }
  }
}

// React hook for smart filtering
export function useSmartFiltering() {
  const classifier = NotificationClassifier.getInstance();
  const filterEngine = SmartFilterEngine.getInstance();

  const classify = (payload: PushNotificationPayload) => {
    return classifier.classify(payload);
  };

  const process = (payload: PushNotificationPayload) => {
    return filterEngine.processNotification(payload);
  };

  const addFilter = (filter: Omit<SmartFilter, "id" | "createdAt" | "updatedAt">) => {
    return filterEngine.addFilter(filter);
  };

  const updateFilter = (filterId: string, updates: Partial<SmartFilter>) => {
    return filterEngine.updateFilter(filterId, updates);
  };

  const removeFilter = (filterId: string) => {
    return filterEngine.removeFilter(filterId);
  };

  const getFilters = () => {
    return filterEngine.getFilters();
  };

  const toggleFilter = (filterId: string, enabled: boolean) => {
    return filterEngine.toggleFilter(filterId, enabled);
  };

  return {
    classify,
    process,
    addFilter,
    updateFilter,
    removeFilter,
    getFilters,
    toggleFilter
  };
}

// Predefined smart filters
export const predefinedFilters: Omit<SmartFilter, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Блокирай системни известия през нощта",
    description: "Автоматично блокира системни известия между 22:00 и 08:00",
    type: SmartFilterType.TIME_BASED,
    enabled: true,
    priority: 10,
    conditions: [
      {
        field: "channel",
        operator: FilterOperator.EQUALS,
        value: "system"
      },
      {
        field: "type",
        operator: FilterOperator.EQUALS,
        value: "maintenance"
      }
    ],
    actions: [
      {
        type: FilterActionType.BLOCK,
        value: null,
        description: "Block system notifications during night hours"
      }
    ]
  },
  {
    name: "Групирай подобни известия",
    description: "Групира известия със същите ключови думи",
    type: SmartFilterType.CONTENT_BASED,
    enabled: true,
    priority: 5,
    conditions: [
      {
        field: "title",
        operator: FilterOperator.CONTAINS,
        value: "нов"
      }
    ],
    actions: [
      {
        type: FilterActionType.GROUP,
        value: "новини",
        description: "Group similar news notifications"
      }
    ]
  },
  {
    name: "Увеличи приоритет за спешни сигнали",
    description: "Автоматично увеличава приоритета на сигнали от критични райони",
    type: SmartFilterType.KEYWORD,
    enabled: true,
    priority: 8,
    conditions: [
      {
        field: "channel",
        operator: FilterOperator.EQUALS,
        value: "signals"
      },
      {
        field: "title",
        operator: FilterOperator.CONTAINS,
        value: "авария"
      }
    ],
    actions: [
      {
        type: FilterActionType.MODIFY_PRIORITY,
        value: NotificationPriority.URGENT,
        description: "Upgrade priority for emergency signals"
      }
    ]
  }
];

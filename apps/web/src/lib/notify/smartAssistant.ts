import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PushNotificationPayload } from "./pushManager";
import { NotificationScheduler } from "./scheduler";
import { NotificationAnalyticsManager } from "./analytics";
import { SmartFilterEngine } from "./smartFiltering";
import { AIPersonalizationEngine } from "./aiPersonalization";
import { MLPredictionEngine } from "./mlPrediction";

// NLP Types
export interface NLPIntent {
  id: string;
  name: string;
  confidence: number;
  entities: NLPEntity[];
  parameters: Record<string, any>;
  context: string;
}

export interface NLPEntity {
  type: "channel" | "time" | "priority" | "action" | "number" | "boolean" | "custom";
  value: any;
  confidence: number;
  start: number;
  end: number;
  metadata?: Record<string, any>;
}

export interface AssistantMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AssistantResponse {
  message: string;
  actions: AssistantAction[];
  suggestions: string[];
  confidence: number;
  context: string;
  followUp: string[];
}

export interface AssistantAction {
  type: "create" | "update" | "delete" | "query" | "analyze" | "suggest";
  description: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface ConversationContext {
  currentIntent: string;
  entities: NLPEntity[];
  conversationHistory: AssistantMessage[];
  userPreferences: Record<string, any>;
  sessionData: Record<string, any>;
}

// Smart Notification Assistant
export class SmartNotificationAssistant {
  private static instance: SmartNotificationAssistant;
  private conversations: Map<string, ConversationContext> = new Map();
  private nlpEngine: NLPEngine;
  private responseGenerator: ResponseGenerator;
  private actionExecutor: ActionExecutor;

  private constructor() {
    this.nlpEngine = new NLPEngine();
    this.responseGenerator = new ResponseGenerator();
    this.actionExecutor = new ActionExecutor();
  }

  static getInstance(): SmartNotificationAssistant {
    if (!SmartNotificationAssistant.instance) {
      SmartNotificationAssistant.instance = new SmartNotificationAssistant();
    }
    return SmartNotificationAssistant.instance;
  }

  // Process user message
  async processMessage(
    userId: string,
    message: string,
    context?: Partial<ConversationContext>
  ): Promise<AssistantResponse> {
    try {
      // Get or create conversation context
      const conversationContext = this.getOrCreateConversationContext(userId, context);

      // Analyze message with NLP
      const intent = await this.nlpEngine.analyzeIntent(message, conversationContext);

      // Update conversation context
      conversationContext.currentIntent = intent.name;
      conversationContext.entities = intent.entities;

      // Generate response
      const response = await this.responseGenerator.generateResponse(
        intent,
        conversationContext
      );

      // Execute any actions
      if (response.actions.length > 0) {
        await this.actionExecutor.executeActions(response.actions, userId, conversationContext);
      }

      // Add messages to conversation history
      conversationContext.conversationHistory.push({
        id: this.generateMessageId(),
        type: "user",
        content: message,
        timestamp: Date.now()
      });

      conversationContext.conversationHistory.push({
        id: this.generateMessageId(),
        type: "assistant",
        content: response.message,
        timestamp: Date.now(),
        metadata: { actions: response.actions, confidence: response.confidence }
      });

      // Limit conversation history
      if (conversationContext.conversationHistory.length > 50) {
        conversationContext.conversationHistory = conversationContext.conversationHistory.slice(-30);
      }

      // Save conversation context
      this.conversations.set(userId, conversationContext);

      return response;
    } catch (error) {
      console.error("Failed to process assistant message:", error);
      return this.getFallbackResponse(message);
    }
  }

  // Get conversation context
  private getOrCreateConversationContext(
    userId: string,
    context?: Partial<ConversationContext>
  ): ConversationContext {
    if (this.conversations.has(userId)) {
      return this.conversations.get(userId)!;
    }

    const defaultContext: ConversationContext = {
      currentIntent: "general",
      entities: [],
      conversationHistory: [],
      userPreferences: {},
      sessionData: {},
      ...context
    };

    this.conversations.set(userId, defaultContext);
    return defaultContext;
  }

  // Generate message ID
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get fallback response
  private getFallbackResponse(userMessage: string): AssistantResponse {
    return {
      message: `Извинявам се, но не можах да разбера "${userMessage}". Можете ли да опитате да преформулирате въпроса си?`,
      actions: [],
      suggestions: [
        "Покажи ми последните известия",
        "Настройки за известия",
        "Анализирай известията ми",
        "Помогни ми да организирам известията"
      ],
      confidence: 0,
      context: "fallback",
      followUp: ["Какво имахте предвид?", "Можете ли да дадете повече детайли?"]
    };
  }
}

// NLP Engine for Intent Recognition
export class NLPEngine {
  private intents: Map<string, IntentPattern> = new Map();
  private entities: Map<string, EntityPattern> = new Map();

  constructor() {
    this.initializeIntents();
    this.initializeEntities();
  }

  // Analyze user message intent
  async analyzeIntent(message: string, context: ConversationContext): Promise<NLPIntent> {
    const normalizedMessage = this.normalizeText(message);
    const tokens = this.tokenize(normalizedMessage);

    // Find matching intents
    const intentScores = this.scoreIntents(tokens, context);

    // Get best intent
    const bestIntent = Array.from(intentScores.entries())
      .sort(([,a], [,b]) => b - a)[0];

    if (!bestIntent || bestIntent[1] < 0.3) {
      return {
        id: "unknown",
        name: "unknown",
        confidence: 0,
        entities: [],
        parameters: {},
        context: "unknown"
      };
    }

    // Extract entities
    const entities = this.extractEntities(tokens, normalizedMessage);

    // Extract parameters
    const parameters = this.extractParameters(tokens, entities, context);

    return {
      id: bestIntent[0],
      name: bestIntent[0],
      confidence: bestIntent[1],
      entities,
      parameters,
      context: this.determineContext(intentScores, context)
    };
  }

  // Normalize text
  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[.,!?;]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Tokenize text
  private tokenize(text: string): string[] {
    return text.split(/\s+/)
      .filter(token => token.length > 0)
      .map(token => token.replace(/[^\w]/g, ''));
  }

  // Score intents
  private scoreIntents(tokens: string[], context: ConversationContext): Map<string, number> {
    const scores = new Map<string, number>();

    for (const [intentName, pattern] of this.intents) {
      let score = 0;

      // Check keywords
      for (const token of tokens) {
        if (pattern.keywords.includes(token)) {
          score += 1;
        }
      }

      // Check phrases
      for (const phrase of pattern.phrases) {
        if (tokens.includes(phrase)) {
          score += 2;
        }
      }

      // Check patterns
      for (const patternRegex of pattern.patterns) {
        if (patternRegex.test(tokens.join(' '))) {
          score += 3;
        }
      }

      // Context bonus
      if (context.currentIntent === intentName) {
        score += 1;
      }

      scores.set(intentName, score / 10); // Normalize
    }

    return scores;
  }

  // Extract entities
  private extractEntities(tokens: string[], originalText: string): NLPEntity[] {
    const entities: NLPEntity[] = [];

    // Extract time entities
    entities.push(...this.extractTimeEntities(originalText));

    // Extract channel entities
    entities.push(...this.extractChannelEntities(tokens));

    // Extract priority entities
    entities.push(...this.extractPriorityEntities(tokens));

    // Extract action entities
    entities.push(...this.extractActionEntities(tokens));

    // Extract number entities
    entities.push(...this.extractNumberEntities(tokens));

    // Extract boolean entities
    entities.push(...this.extractBooleanEntities(tokens));

    return entities;
  }

  // Extract time entities
  private extractTimeEntities(text: string): NLPEntity[] {
    const entities: NLPEntity[] = [];
    const timePatterns = [
      /(\d{1,2}):(\d{2})/g, // HH:MM
      /(\d{1,2})\s*(сутринта|следобед|вечерта|нощем)/g, // 9 сутринта
      /(утре|днес|вчера)/g, // Relative days
      /(след|през)\s+(\d+)\s+(минути|часа|дни|седмици)/g // In X minutes
    ];

    let match;
    for (const pattern of timePatterns) {
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: "time",
          value: match[0],
          confidence: 0.9,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }

    return entities;
  }

  // Extract channel entities
  private extractChannelEntities(tokens: string[]): NLPEntity[] {
    const entities: NLPEntity[] = [];
    const channelKeywords = ["сигнали", "идеи", "събития", "системни", "signals", "ideas", "events", "system"];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (channelKeywords.includes(token)) {
        entities.push({
          type: "channel",
          value: token,
          confidence: 0.9,
          start: i,
          end: i + 1
        });
      }
    }

    return entities;
  }

  // Extract priority entities
  private extractPriorityEntities(tokens: string[]): NLPEntity[] {
    const entities: NLPEntity[] = [];
    const priorityKeywords = ["висок", "нисък", "спешен", "urgent", "high", "low", "normal"];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (priorityKeywords.includes(token)) {
        entities.push({
          type: "priority",
          value: token,
          confidence: 0.8,
          start: i,
          end: i + 1
        });
      }
    }

    return entities;
  }

  // Extract action entities
  private extractActionEntities(tokens: string[]): NLPEntity[] {
    const entities: NLPEntity[] = [];
    const actionKeywords = ["покажи", "скрий", "изтрий", "промени", "направи", "show", "hide", "delete", "change", "create"];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (actionKeywords.includes(token)) {
        entities.push({
          type: "action",
          value: token,
          confidence: 0.8,
          start: i,
          end: i + 1
        });
      }
    }

    return entities;
  }

  // Extract number entities
  private extractNumberEntities(tokens: string[]): NLPEntity[] {
    const entities: NLPEntity[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const number = parseInt(token);
      if (!isNaN(number)) {
        entities.push({
          type: "number",
          value: number,
          confidence: 0.9,
          start: i,
          end: i + 1
        });
      }
    }

    return entities;
  }

  // Extract boolean entities
  private extractBooleanEntities(tokens: string[]): NLPEntity[] {
    const entities: NLPEntity[] = [];
    const booleanKeywords = ["да", "не", "включи", "изключи", "yes", "no", "on", "off"];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (booleanKeywords.includes(token)) {
        entities.push({
          type: "boolean",
          value: token === "да" || token === "включи" || token === "yes" || token === "on",
          confidence: 0.9,
          start: i,
          end: i + 1
        });
      }
    }

    return entities;
  }

  // Extract parameters
  private extractParameters(
    tokens: string[],
    entities: NLPEntity[],
    context: ConversationContext
  ): Record<string, any> {
    const parameters: Record<string, any> = {};

    // Extract entity-based parameters
    entities.forEach(entity => {
      switch (entity.type) {
        case "channel":
          parameters.channel = entity.value;
          break;
        case "priority":
          parameters.priority = entity.value;
          break;
        case "number":
          parameters.count = entity.value;
          break;
        case "boolean":
          parameters.enabled = entity.value;
          break;
        case "time":
          parameters.time = entity.value;
          break;
      }
    });

    // Context-based parameter extraction
    if (context.currentIntent === "query_notifications") {
      parameters.limit = parameters.count || 10;
      parameters.channel = parameters.channel || "all";
    }

    return parameters;
  }

  // Determine context
  private determineContext(intentScores: Map<string, number>, context: ConversationContext): string {
    const topIntent = Array.from(intentScores.entries()).sort(([,a], [,b]) => b - a)[0];

    if (topIntent[1] > 0.5) {
      return topIntent[0];
    }

    return context.currentIntent || "general";
  }

  // Initialize intents
  private initializeIntents() {
    const intentPatterns: IntentPattern[] = [
      {
        name: "query_notifications",
        keywords: ["покажи", "виж", "известия", "show", "notifications"],
        phrases: ["покажи известия", "виж известията", "show notifications"],
        patterns: [/покажи.*известия/i, /виж.*известия/i],
        examples: ["Покажи ми последните известия", "Какви известия имам?"]
      },
      {
        name: "manage_settings",
        keywords: ["настройки", "конфигурирай", "settings", "configure"],
        phrases: ["настройки за известия", "конфигурирай известията"],
        patterns: [/настройки.*известия/i, /конфигурирай.*известия/i],
        examples: ["Промени настройките за известия", "Как да конфигурирам известията?"]
      },
      {
        name: "create_notification",
        keywords: ["създай", "ново", "create", "new"],
        phrases: ["създай известие", "ново известие"],
        patterns: [/създай.*известие/i, /ново.*известие/i],
        examples: ["Създай ново известие", "Искам да направя известие"]
      },
      {
        name: "analyze_notifications",
        keywords: ["анализирай", "статистика", "analyze", "statistics"],
        phrases: ["анализирай известията", "статистика за известия"],
        patterns: [/анализирай.*известия/i, /статистика.*известия/i],
        examples: ["Анализирай известията ми", "Покажи статистика"]
      },
      {
        name: "filter_notifications",
        keywords: ["филтрирай", "сортирай", "filter", "sort"],
        phrases: ["филтрирай известия", "сортирай известията"],
        patterns: [/филтрирай.*известия/i, /сортирай.*известия/i],
        examples: ["Филтрирай известията по канал", "Сортирай по приоритет"]
      },
      {
        name: "help",
        keywords: ["помогни", "help", "как", "how"],
        phrases: ["как да", "помогни ми"],
        patterns: [/как.*да/i, /помогни.*с/i],
        examples: ["Как да използвам асистента?", "Помогни ми с известията"]
      }
    ];

    intentPatterns.forEach(pattern => {
      this.intents.set(pattern.name, pattern);
    });
  }

  // Initialize entities
  private initializeEntities() {
    const entityPatterns: EntityPattern[] = [
      {
        name: "time",
        patterns: [/\d{1,2}:\d{2}/, /утре|днес|вчера/],
        extractors: [(text: string) => this.extractTimeEntities(text)]
      },
      {
        name: "channel",
        patterns: [/сигнали|идеи|събития|системни/],
        extractors: [(text: string) => this.extractChannelEntities(text.split(/\s+/))]
      }
    ];

    entityPatterns.forEach(pattern => {
      this.entities.set(pattern.name, pattern);
    });
  }
}

// Intent and Entity Patterns
interface IntentPattern {
  name: string;
  keywords: string[];
  phrases: string[];
  patterns: RegExp[];
  examples: string[];
}

interface EntityPattern {
  name: string;
  patterns: RegExp[];
  extractors: ((text: string) => NLPEntity[])[];
}

// Response Generator
export class ResponseGenerator {
  private responseTemplates: Map<string, ResponseTemplate[]> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  async generateResponse(intent: NLPIntent, context: ConversationContext): Promise<AssistantResponse> {
    const templates = this.responseTemplates.get(intent.name) || this.responseTemplates.get("general") || [];

    // Select best template
    const template = templates[0] || this.getDefaultTemplate();

    // Generate response
    const message = this.generateMessage(template, intent, context);

    // Generate actions
    const actions = this.generateActions(template, intent, context);

    // Generate suggestions
    const suggestions = this.generateSuggestions(intent, context);

    return {
      message,
      actions,
      suggestions,
      confidence: intent.confidence,
      context: intent.context,
      followUp: template.followUp || []
    };
  }

  private generateMessage(template: ResponseTemplate, intent: NLPIntent, context: ConversationContext): string {
    let message = template.message;

    // Replace placeholders
    message = message.replace(/\{user\}/g, "потребител");
    message = message.replace(/\{channel\}/g, intent.parameters.channel || "канал");
    message = message.replace(/\{time\}/g, intent.parameters.time || "време");
    message = message.replace(/\{count\}/g, intent.parameters.count || "няколко");

    return message;
  }

  private generateActions(template: ResponseTemplate, intent: NLPIntent, context: ConversationContext): AssistantAction[] {
    return template.actions.map(actionTemplate => ({
      type: actionTemplate.type,
      description: actionTemplate.description,
      parameters: actionTemplate.parameters,
      confidence: 0.8
    }));
  }

  private generateSuggestions(intent: NLPIntent, context: ConversationContext): string[] {
    const suggestions: string[] = [];

    switch (intent.name) {
      case "query_notifications":
        suggestions.push(
          "Покажи ми само сигналите",
          "Филтрирай по приоритет",
          "Покажи последните 5 известия"
        );
        break;
      case "manage_settings":
        suggestions.push(
          "Промени настройките за звук",
          "Настрой тихите часове",
          "Конфигурирай каналите"
        );
        break;
      default:
        suggestions.push(
          "Какво друго мога да направя?",
          "Покажи ми опциите",
          "Помогни ми с нещо конкретно"
        );
    }

    return suggestions;
  }

  private getDefaultTemplate(): ResponseTemplate {
    return {
      message: "Разбрах въпроса ви. Как мога да ви помогна с известията?",
      actions: [],
      suggestions: [],
      followUp: ["Какво имахте предвид?", "Можете ли да дадете повече детайли?"]
    };
  }

  private initializeTemplates() {
    const templates: ResponseTemplate[] = [
      {
        intent: "query_notifications",
        message: "Ето информацията за вашите известия. Намерих {count} известия в канал {channel}.",
        actions: [
          {
            type: "query",
            description: "Query notifications",
            parameters: { limit: 10, channel: "all" }
          }
        ],
        suggestions: ["Покажи повече", "Филтрирай по тип", "Сортирай по време"],
        followUp: ["Искате ли да видите повече детайли?", "Да филтрирам ли резултатите?"]
      },
      {
        intent: "manage_settings",
        message: "Мога да ви помогна с настройките за известия. Какво бихте искали да промените?",
        actions: [
          {
            type: "query",
            description: "Get current settings",
            parameters: {}
          }
        ],
        suggestions: ["Промени звука", "Настрой каналите", "Конфигурирай времето"],
        followUp: ["Кои настройки ви интересуват?", "Какво да променя?"]
      }
    ];

    templates.forEach(template => {
      if (!this.responseTemplates.has(template.intent)) {
        this.responseTemplates.set(template.intent, []);
      }
      this.responseTemplates.get(template.intent)!.push(template);
    });
  }
}

interface ResponseTemplate {
  intent: string;
  message: string;
  actions: Array<{
    type: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  suggestions: string[];
  followUp: string[];
}

// Action Executor
export class ActionExecutor {
  private scheduler: NotificationScheduler;
  private analytics: NotificationAnalyticsManager;
  private filterEngine: SmartFilterEngine;
  private personalization: AIPersonalizationEngine;

  constructor() {
    this.scheduler = NotificationScheduler.getInstance();
    this.analytics = NotificationAnalyticsManager.getInstance();
    this.filterEngine = SmartFilterEngine.getInstance();
    this.personalization = AIPersonalizationEngine.getInstance();
  }

  async executeActions(actions: AssistantAction[], userId: string, context: ConversationContext): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, userId, context);
      } catch (error) {
        console.error(`Failed to execute action ${action.type}:`, error);
      }
    }
  }

  private async executeAction(action: AssistantAction, userId: string, context: ConversationContext): Promise<void> {
    switch (action.type) {
      case "query":
        await this.executeQueryAction(action, userId);
        break;
      case "create":
        await this.executeCreateAction(action, userId);
        break;
      case "update":
        await this.executeUpdateAction(action, userId);
        break;
      case "delete":
        await this.executeDeleteAction(action, userId);
        break;
      case "analyze":
        await this.executeAnalyzeAction(action, userId);
        break;
      case "suggest":
        await this.executeSuggestAction(action, userId);
        break;
    }
  }

  private async executeQueryAction(action: AssistantAction, userId: string): Promise<void> {
    // Query notifications based on parameters
    console.log("Executing query action:", action.parameters);
  }

  private async executeCreateAction(action: AssistantAction, userId: string): Promise<void> {
    // Create notification or filter
    console.log("Executing create action:", action.parameters);
  }

  private async executeUpdateAction(action: AssistantAction, userId: string): Promise<void> {
    // Update settings or preferences
    console.log("Executing update action:", action.parameters);
  }

  private async executeDeleteAction(action: AssistantAction, userId: string): Promise<void> {
    // Delete notification or filter
    console.log("Executing delete action:", action.parameters);
  }

  private async executeAnalyzeAction(action: AssistantAction, userId: string): Promise<void> {
    // Analyze notifications or patterns
    console.log("Executing analyze action:", action.parameters);
  }

  private async executeSuggestAction(action: AssistantAction, userId: string): Promise<void> {
    // Generate suggestions
    console.log("Executing suggest action:", action.parameters);
  }
}

// React hook for the smart assistant
export function useSmartAssistant() {
  const { user } = useAuth();
  const [assistant] = useState(() => SmartNotificationAssistant.getInstance());
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AssistantMessage[]>([]);

  const sendMessage = useCallback(async (
    message: string,
    context?: Partial<ConversationContext>
  ): Promise<AssistantResponse | null> => {
    if (!user || !message.trim()) return null;

    setIsProcessing(true);
    try {
      const response = await assistant.processMessage(user.uid, message, context);
      setConversationHistory(prev => [...prev, ...[
        { id: Date.now().toString(), type: "user", content: message, timestamp: Date.now() },
        { id: (Date.now() + 1).toString(), type: "assistant", content: response.message, timestamp: Date.now() }
      ]]);
      return response;
    } catch (error) {
      console.error("Failed to send message to assistant:", error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user, assistant]);

  const clearConversation = useCallback(() => {
    setConversationHistory([]);
  }, []);

  return {
    sendMessage,
    isProcessing,
    conversationHistory,
    clearConversation
  };
}

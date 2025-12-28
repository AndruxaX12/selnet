import { PushNotificationPayload } from "./pushManager";

// Base notification template interface
export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  category: "signal" | "idea" | "event" | "system" | "user";
  generate: (data: Record<string, any>) => PushNotificationPayload;
  requiresPermission?: boolean;
}

// Template data interfaces
export interface SignalNotificationData {
  signalId: string;
  signalTitle: string;
  status: string;
  authorName?: string;
  settlementName?: string;
  type?: string;
  priority?: string;
}

export interface IdeaNotificationData {
  ideaId: string;
  ideaTitle: string;
  status: string;
  authorName?: string;
  votesCount?: number;
  settlementName?: string;
}

export interface EventNotificationData {
  eventId: string;
  eventTitle: string;
  status: string;
  eventDate: string;
  authorName?: string;
  settlementName?: string;
  attendeeCount?: number;
}

export interface SystemNotificationData {
  type: "maintenance" | "update" | "announcement" | "reminder";
  title: string;
  message: string;
  actionUrl?: string;
  priority?: "normal" | "high" | "urgent";
}

export interface UserNotificationData {
  type: "mention" | "reply" | "follow" | "achievement";
  userName: string;
  userId: string;
  relatedItem?: {
    type: "signal" | "idea" | "event" | "comment";
    id: string;
    title: string;
  };
  message?: string;
}

// Notification Templates Registry
class NotificationTemplateRegistry {
  private static templates: Map<string, NotificationTemplate> = new Map();

  static register(template: NotificationTemplate) {
    this.templates.set(template.id, template);
  }

  static get(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  static getAll(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  static getByCategory(category: string): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }
}

// Signal Status Change Template
const signalStatusChangeTemplate: NotificationTemplate = {
  id: "signal-status-change",
  name: "Промяна в статус на сигнал",
  description: "Известие при промяна на статуса на сигнал",
  category: "signal",
  generate: (data: SignalNotificationData) => ({
    title: `Сигнал: ${data.status}`,
    body: data.signalTitle,
    icon: getSignalIcon(data.status),
    badge: "/icons/icon-192.png",
    type: "signal",
    channel: "signals",
    priority: getSignalPriority(data.priority),
    url: `/signals/${data.signalId}`,
    tag: `signal-${data.signalId}-${Date.now()}`,
    actions: [
      { action: "view", title: "Виж сигнала" },
      { action: "mark-read", title: "Прочетено" }
    ],
    customData: {
      signalId: data.signalId,
      status: data.status,
      settlementName: data.settlementName
    }
  })
};

// Idea Status Change Template
const ideaStatusChangeTemplate: NotificationTemplate = {
  id: "idea-status-change",
  name: "Промяна в статус на идея",
  description: "Известие при промяна на статуса на идея",
  category: "idea",
  generate: (data: IdeaNotificationData) => ({
    title: `Идея: ${data.status}`,
    body: data.ideaTitle,
    icon: getIdeaIcon(data.status),
    badge: "/icons/icon-192.png",
    type: "idea",
    channel: "ideas",
    priority: data.votesCount && data.votesCount > 10 ? "high" : "normal",
    url: `/ideas/${data.ideaId}`,
    tag: `idea-${data.ideaId}-${Date.now()}`,
    actions: [
      { action: "view", title: "Виж идеята" },
      { action: "mark-read", title: "Прочетено" }
    ],
    customData: {
      ideaId: data.ideaId,
      status: data.status,
      votesCount: data.votesCount
    }
  })
};

// Event Status Change Template
const eventStatusChangeTemplate: NotificationTemplate = {
  id: "event-status-change",
  name: "Промяна в статус на събитие",
  description: "Известие при промяна на статуса на събитие",
  category: "event",
  generate: (data: EventNotificationData) => ({
    title: `Събитие: ${data.status}`,
    body: `${data.eventTitle} - ${new Date(data.eventDate).toLocaleDateString('bg-BG')}`,
    icon: getEventIcon(data.status),
    badge: "/icons/icon-192.png",
    type: "event",
    channel: "events",
    priority: isEventUrgent(data.eventDate) ? "urgent" : "normal",
    url: `/events/${data.eventId}`,
    tag: `event-${data.eventId}-${Date.now()}`,
    actions: [
      { action: "view", title: "Виж събитието" },
      { action: "rsvp", title: "Потвърди участие" }
    ],
    customData: {
      eventId: data.eventId,
      status: data.status,
      eventDate: data.eventDate,
      attendeeCount: data.attendeeCount
    }
  })
};

// System Announcement Template
const systemAnnouncementTemplate: NotificationTemplate = {
  id: "system-announcement",
  name: "Системно съобщение",
  description: "Системни съобщения и анонси",
  category: "system",
  generate: (data: SystemNotificationData) => ({
    title: "СелНет",
    body: data.title,
    icon: getSystemIcon(data.type),
    badge: "/icons/icon-192.png",
    type: "system",
    channel: "system",
    priority: data.priority || "normal",
    url: data.actionUrl || "/",
    tag: `system-${data.type}-${Date.now()}`,
    requireInteraction: data.priority === "urgent",
    actions: data.actionUrl ? [
      { action: "view", title: "Виж повече" }
    ] : undefined,
    customData: {
      type: data.type,
      priority: data.priority
    }
  })
};

// User Mention Template
const userMentionTemplate: NotificationTemplate = {
  id: "user-mention",
  name: "Споменаване в коментар",
  description: "Някой ви спомена в коментар",
  category: "user",
  generate: (data: UserNotificationData) => ({
    title: `${data.userName} ви спомена`,
    body: data.message || `В ${getItemTypeName(data.relatedItem?.type || "signal")}`,
    icon: "💬",
    badge: "/icons/icon-192.png",
    type: "user",
    channel: "system",
    priority: "high",
    url: data.relatedItem ? getItemUrl(data.relatedItem) : "/",
    tag: `mention-${data.userId}-${Date.now()}`,
    actions: [
      { action: "view", title: "Виж коментара" },
      { action: "reply", title: "Отговори" }
    ],
    customData: {
      userId: data.userId,
      userName: data.userName,
      relatedItem: data.relatedItem
    }
  })
};

// Achievement Template
const achievementTemplate: NotificationTemplate = {
  id: "user-achievement",
  name: "Постижение",
  description: "Постигнахте ново постижение",
  category: "user",
  generate: (data: UserNotificationData) => ({
    title: "🎉 Ново постижение!",
    body: data.message || "Поздравления за постигането!",
    icon: "🏆",
    badge: "/icons/icon-192.png",
    type: "user",
    channel: "system",
    priority: "high",
    url: "/me/achievements",
    tag: `achievement-${Date.now()}`,
    actions: [
      { action: "view", title: "Виж постиженията" }
    ],
    customData: {
      achievementType: data.type,
      userId: data.userId
    }
  })
};

// Helper functions
function getSignalIcon(status: string): string {
  switch (status.toLowerCase()) {
    case "нов": return "🆕";
    case "в процес": return "🔄";
    case "решен": return "✅";
    case "отхвърлен": return "❌";
    default: return "📣";
  }
}

function getIdeaIcon(status: string): string {
  switch (status.toLowerCase()) {
    case "нова": return "💡";
    case "одобрена": return "✅";
    case "в процес": return "🔄";
    case "реализирана": return "🎉";
    case "отхвърлена": return "❌";
    default: return "💡";
  }
}

function getEventIcon(status: string): string {
  switch (status.toLowerCase()) {
    case "предстоящо": return "📅";
    case "в процес": return "🔴";
    case "завършено": return "✅";
    case "отменено": return "❌";
    default: return "📅";
  }
}

function getSystemIcon(type: string): string {
  switch (type) {
    case "maintenance": return "🔧";
    case "update": return "⬆️";
    case "announcement": return "📢";
    case "reminder": return "⏰";
    default: return "ℹ️";
  }
}

function getSignalPriority(priority?: string): "normal" | "high" | "urgent" {
  if (!priority) return "normal";
  return priority.toLowerCase() === "urgent" ? "urgent" : "high";
}

function isEventUrgent(eventDate: string): boolean {
  const eventTime = new Date(eventDate).getTime();
  const now = Date.now();
  const hoursUntilEvent = (eventTime - now) / (1000 * 60 * 60);
  return hoursUntilEvent <= 24 && hoursUntilEvent > 0;
}

function getItemTypeName(type: string): string {
  switch (type) {
    case "signal": return "сигнал";
    case "idea": return "идея";
    case "event": return "събитие";
    case "comment": return "коментар";
    default: return "публикация";
  }
}

function getItemUrl(item: { type: string; id: string; title: string }): string {
  switch (item.type) {
    case "signal": return `/signals/${item.id}`;
    case "idea": return `/ideas/${item.id}`;
    case "event": return `/events/${item.id}`;
    case "comment": return `/comments/${item.id}`;
    default: return "/";
  }
}

// Register all templates
NotificationTemplateRegistry.register(signalStatusChangeTemplate);
NotificationTemplateRegistry.register(ideaStatusChangeTemplate);
NotificationTemplateRegistry.register(eventStatusChangeTemplate);
NotificationTemplateRegistry.register(systemAnnouncementTemplate);
NotificationTemplateRegistry.register(userMentionTemplate);
NotificationTemplateRegistry.register(achievementTemplate);

// Export registry for use in other modules
export { NotificationTemplateRegistry };

// Utility functions for creating notifications
export class NotificationFactory {
  static createFromTemplate(templateId: string, data: Record<string, any>): PushNotificationPayload | null {
    const template = NotificationTemplateRegistry.get(templateId);
    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return null;
    }

    try {
      return template.generate(data);
    } catch (error) {
      console.error(`Error generating notification from template ${templateId}:`, error);
      return null;
    }
  }

  static createSignalNotification(data: SignalNotificationData): PushNotificationPayload {
    return signalStatusChangeTemplate.generate(data);
  }

  static createIdeaNotification(data: IdeaNotificationData): PushNotificationPayload {
    return ideaStatusChangeTemplate.generate(data);
  }

  static createEventNotification(data: EventNotificationData): PushNotificationPayload {
    return eventStatusChangeTemplate.generate(data);
  }

  static createSystemNotification(data: SystemNotificationData): PushNotificationPayload {
    return systemAnnouncementTemplate.generate(data);
  }

  static createUserNotification(data: UserNotificationData): PushNotificationPayload {
    return userMentionTemplate.generate(data);
  }

  static createAchievementNotification(data: UserNotificationData): PushNotificationPayload {
    return achievementTemplate.generate(data);
  }
}

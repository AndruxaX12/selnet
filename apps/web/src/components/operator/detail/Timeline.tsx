import { formatDateTime } from "@/lib/operator/sla-utils";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  MessageSquare,
  Wrench,
  AlertTriangle,
  Clock
} from "lucide-react";

interface TimelineEvent {
  id: string;
  type:
    | "status_change"
    | "note_added"
    | "assigned"
    | "work_order_created"
    | "escalation"
    | "reminder";
  actor: string;
  created_at: string;
  data: Record<string, any>;
}

interface Props {
  events: TimelineEvent[];
}

export function Timeline({ events }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Хронология</h2>
        <p className="text-center py-8 text-gray-500">Няма събития</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Хронология
      </h2>

      <div className="space-y-6">
        {events.map((event, idx) => (
          <TimelineItem
            key={event.id}
            event={event}
            isLast={idx === events.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const icon = getEventIcon(event.type);
  const color = getEventColor(event.type);

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200"></div>
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 p-2 rounded-lg ${color}`}>{icon}</div>

      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-start justify-between gap-4 mb-1">
          <p className="font-medium text-gray-900">{getEventTitle(event)}</p>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatDateTime(event.created_at)}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-1">{event.actor}</p>
        {event.data.description && (
          <p className="text-sm text-gray-500 mt-2">{event.data.description}</p>
        )}
      </div>
    </div>
  );
}

function getEventIcon(type: string) {
  switch (type) {
    case "status_change":
      return <ArrowRight className="h-5 w-5" />;
    case "note_added":
      return <MessageSquare className="h-5 w-5" />;
    case "assigned":
      return <User className="h-5 w-5" />;
    case "work_order_created":
      return <Wrench className="h-5 w-5" />;
    case "escalation":
      return <AlertTriangle className="h-5 w-5" />;
    default:
      return <Clock className="h-5 w-5" />;
  }
}

function getEventColor(type: string) {
  switch (type) {
    case "status_change":
      return "bg-blue-100 text-blue-600";
    case "note_added":
      return "bg-purple-100 text-purple-600";
    case "assigned":
      return "bg-green-100 text-green-600";
    case "work_order_created":
      return "bg-orange-100 text-orange-600";
    case "escalation":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getEventTitle(event: TimelineEvent): string {
  switch (event.type) {
    case "status_change":
      return `Статус променен: ${event.data.from} → ${event.data.to}`;
    case "note_added":
      return event.data.type === "internal" ? "Добавена вътрешна бележка" : "Добавена публична бележка";
    case "assigned":
      return `Възложен на ${event.data.owner_name}`;
    case "work_order_created":
      return "Създаден работен ордер";
    case "escalation":
      return "Ескалация към Омбудсман";
    default:
      return "Събитие";
  }
}

type RecordType = "signals" | "ideas" | "events";

const SLA_MAP: Record<RecordType, number> = {
  signals: 48,
  ideas: 72,
  events: 24
};

const SAFE_STATUSES = new Set(["resolved", "rejected", "archived"]);

export default function SlaBadge({
  type,
  createdAt,
  status
}: {
  type: RecordType;
  createdAt?: number;
  status: string;
}) {
  if (!createdAt || SAFE_STATUSES.has(status)) {
    return <span className="text-xs text-neutral-500">—</span>;
  }

  const hours = SLA_MAP[type] ?? 48;
  const elapsed = Date.now() - createdAt;
  const remaining = hours * 3600 * 1000 - elapsed;

  let cls = "bg-green-600 text-white";
  if (remaining < 0) {
    cls = "bg-red-600 text-white";
  } else if (remaining < 6 * 3600 * 1000) {
    cls = "bg-amber-500 text-white";
  }

  const label = remaining < 0 ? "Просрочено" : `${Math.ceil(remaining / 3600000)}ч`;

  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

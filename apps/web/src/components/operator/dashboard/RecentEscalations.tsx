import Link from "next/link";
import { formatRelativeTime } from "@/lib/operator/sla-utils";
import { AlertTriangle } from "lucide-react";
import { usePathname } from "next/navigation";

interface Escalation {
  id: string;
  signal_id: string;
  signal_title: string;
  created_at: string;
}

interface Props {
  escalations: Escalation[];
}

export function RecentEscalations({ escalations }: Props) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;

  if (!escalations || escalations.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>Няма ескалации</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {escalations.map((escalation) => (
        <Link
          key={escalation.id}
          href={`${base}/operator/signals/${escalation.signal_id}#escalation`}
          className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">
                {escalation.signal_title}
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Ескалирано {formatRelativeTime(escalation.created_at)}
              </p>
            </div>

            <span className="flex-shrink-0 text-xs text-gray-400">
              #{escalation.signal_id.slice(0, 8)}
            </span>
          </div>
        </Link>
      ))}

      {escalations.length > 5 && (
        <Link
          href={`${base}/operator/inbox?tab=escalations`}
          className="block text-center py-3 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Виж всички ескалации →
        </Link>
      )}
    </div>
  );
}

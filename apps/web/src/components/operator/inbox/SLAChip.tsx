import { SLA_COLORS } from "@/lib/operator/constants";
import { Clock, AlertCircle } from "lucide-react";

interface SLAData {
  status: "ok" | "warning" | "overdue";
  text: string;
  remaining: number;
}

interface Props {
  sla: SLAData;
  label?: string;
}

export function SLAChip({ sla, label }: Props) {
  const Icon = sla.status === "overdue" ? AlertCircle : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${
        SLA_COLORS[sla.status]
      }`}
    >
      <Icon className="h-4 w-4" />
      {label && <span className="font-normal">{label}:</span>}
      {sla.text}
    </span>
  );
}

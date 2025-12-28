export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    resolved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    overdue: "bg-purple-100 text-purple-700"
  };
  const cls = map[status] ?? "bg-neutral-100 text-neutral-700";
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

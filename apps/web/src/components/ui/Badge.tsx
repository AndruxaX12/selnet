export function StatusBadge({ v }: { v?: string }) {
  const map: Record<string, string> = {
    "ново": "bg-neutral-800 text-white",
    "new": "bg-neutral-800 text-white",
    "в процес": "bg-emerald-600 text-white",
    "in_progress": "bg-emerald-600 text-white",
    "вчера": "bg-sky-600 text-white"
  };
  const cls = map[v || ""] || "bg-neutral-200 text-neutral-800";
  return <span className={`text-[11px] px-2 py-1 rounded-full ${cls}`}>{label(v)}</span>;
}

function label(v?: string) {
  if (!v) return "ново";
  return (
    {
      new: "ново",
      triaged: "оценено",
      in_progress: "в процес",
      resolved: "решено",
      rejected: "отхвърлено",
      archived: "архив"
    } as Record<string, string>
  )[v ?? ""] || v || "";
}

export function Badge({
  children,
  variant = "default",
  className = ""
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive";
  className?: string;
}) {
  const variants = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    secondary: "bg-gray-100 text-gray-800 border-gray-200",
    destructive: "bg-red-100 text-red-800 border-red-200"
  };

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

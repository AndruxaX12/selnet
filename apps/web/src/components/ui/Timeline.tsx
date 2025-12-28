export default function Timeline({ items }: { items: Array<{ id: string; at: number; text: string; by?: string }> }) {
  return (
    <ul className="space-y-3">
      {items.sort((a,b)=>b.at-a.at).map(i => (
        <li key={i.id} className="rounded border p-3">
          <div className="text-xs text-neutral-500">{new Date(i.at).toLocaleString()}</div>
          <div className="text-sm">{i.text}{i.by ? ` — ${i.by}` : ""}</div>
        </li>
      ))}
    </ul>
  );
}

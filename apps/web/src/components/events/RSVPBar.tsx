"use client";
import { useEffect, useState } from "react";
import { myRSVP, setRSVP } from "@/lib/rsvp";

export default function RSVPBar({ eventId, goingCount=0, interestedCount=0 }: { eventId: string; goingCount?: number; interestedCount?: number }) {
  const [mine, setMine] = useState<"going"|"interested"|null>(null);
  const [counts, setCounts] = useState({ going: goingCount, interested: interestedCount });
  const [busy, setBusy] = useState(false);

  useEffect(() => { myRSVP(eventId).then(setMine).catch(()=>setMine(null)); }, [eventId]);

  async function toggle(next: "going"|"interested") {
    if (busy) return;
    setBusy(true);
    try {
      if (mine === next) {
        await setRSVP(eventId, null);
        setMine(null);
        setCounts(c => ({ ...c, [next]: Math.max(0, (c as any)[next]-1) }));
      } else {
        await setRSVP(eventId, next);
        if (mine) setCounts(c => ({ ...c, [mine!]: Math.max(0, (c as any)[mine!]-1) }));
        setMine(next);
        setCounts(c => ({ ...c, [next]: (c as any)[next]+1 }));
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={()=>toggle("going")} disabled={busy}
        className={`rounded border px-3 py-1 text-sm transition-colors ${mine==="going"?"bg-black text-white":"hover:bg-gray-50"}` }>
        Ще присъствам ({counts.going})
      </button>
      <button onClick={()=>toggle("interested")} disabled={busy}
        className={`rounded border px-3 py-1 text-sm transition-colors ${mine==="interested"?"bg-black text-white":"hover:bg-gray-50"}` }>
        Интересува ме ({counts.interested})
      </button>
    </div>
  );
}

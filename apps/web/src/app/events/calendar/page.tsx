"use client";
import { useEffect, useMemo, useState } from "react";
import { app } from "@/lib/firebase";
import { collection, getDocs, getFirestore, limit, orderBy, query, where } from "firebase/firestore";
import EventCalendar from "@/components/events/EventCalendar";
import { startOfWeek, addWeeks } from "date-fns";

export default function EventsCalendarPage() {
  const db = useMemo(()=>getFirestore(app), []);
  const [mode, setMode] = useState<"month"|"week">("month");
  const [start, setStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [mode, start]);

  async function load() {
    // семпла заявка: 90 дни около start
    const from = start.getTime() - (mode==="month"? 14: 7) * 24*3600*1000;
    const to   = addWeeks(start, mode==="month"? 6: 1).getTime();
    const snap = await getDocs(query(
      collection(db, "events"),
      where("when", ">=", from),
      where("when", "<=", to),
      orderBy("when","asc"),
      limit(2000)
    ));
    setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Календар</h1>
      <EventCalendar
        events={rows.map(r => ({ id: r.id, title: r.title||"", when: r.when, durationMin: r.durationMin, where: r.where }))}
        mode={mode}
        start={start}
        onNavigate={(d)=>setStart(d)}
        onMode={(m)=>setMode(m)}
      />
    </div>
  );
}

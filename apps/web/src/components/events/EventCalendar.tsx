"use client";
import { addDays, addWeeks, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subWeeks } from "date-fns";
import { bg } from "date-fns/locale";
import Link from "next/link";
import { CalEvent } from "@/types/events";

type Props = {
  events: CalEvent[];
  mode?: "month" | "week";
  start?: Date; // първи ден за изгледа (понеделник)
  onNavigate?: (d: Date) => void;
  onMode?: (m: "month"|"week") => void;
};

export default function EventCalendar({ events, mode="month", start, onNavigate, onMode }: Props) {
  const monday = start ?? startOfWeek(new Date(), { weekStartsOn: 1 });
  const days: Date[] = [];
  const gridStart = mode==="month" ? startOfWeek(startOfMonth(monday), { weekStartsOn:1 }) : monday;
  const gridEnd   = mode==="month" ? endOfWeek(endOfMonth(monday), { weekStartsOn:1 })   : endOfWeek(monday, { weekStartsOn:1 });
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  function prev() { onNavigate?.(mode==="month" ? addWeeks(monday, -4) : subWeeks(monday, 1)); }
  function next() { onNavigate?.(mode==="month" ? addWeeks(monday, 4) : addWeeks(monday, 1)); }
  function today(){ onNavigate?.(startOfWeek(new Date(), { weekStartsOn:1 })); }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-lg font-semibold">
          {format(monday, mode==="month" ? "LLLL yyyy" : "'Седмица от' d LLL yyyy", { locale: bg })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={prev} className="rounded border px-2 py-1 text-sm hover:bg-gray-50 transition-colors">Назад</button>
          <button onClick={today} className="rounded border px-2 py-1 text-sm hover:bg-gray-50 transition-colors">Днес</button>
          <button onClick={next} className="rounded border px-2 py-1 text-sm hover:bg-gray-50 transition-colors">Напред</button>
          <span className="mx-1">|</span>
          <button onClick={()=>onMode?.("month")} className={`rounded border px-2 py-1 text-sm ${mode==="month"?"bg-black text-white":"hover:bg-gray-50"} transition-colors` }>Месец</button>
          <button onClick={()=>onMode?.("week")} className={`rounded border px-2 py-1 text-sm ${mode==="week"?"bg-black text-white":"hover:bg-gray-50"} transition-colors` }>Седмица</button>
        </div>
      </div>

      {/* Grid */}
      <div className={`grid ${mode==="month"?"grid-cols-7":"grid-cols-7"} border rounded` }>
        {/* Header дни */}
        {["Пн","Вт","Ср","Чт","Пт","Сб","Нд"].map((d)=>
          <div key={d} className="p-2 text-xs font-medium border-b bg-neutral-50">{d}</div>
        )}
        {/* Клетки */}
        {days.map((d, idx) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.when), d));
          return (
            <div key={idx} className={`p-2 border-t min-h-[92px] ${mode==="month"&&!isSameMonth(d, monday)?"bg-neutral-50/50 text-neutral-400":""}` }>
              <div className="text-xs mb-1">{format(d, "d", { locale: bg })}</div>
              <ul className="space-y-1">
                {dayEvents.slice(0, 3).map(ev => (
                  <li key={ev.id} className="text-xs">
                    <Link href={`/events/${ev.id}` } className="underline hover:text-blue-600 transition-colors">
                      {format(new Date(ev.when), "HH:mm", { locale: bg })} · {ev.title}
                    </Link>
                  </li>
                ))}
                {dayEvents.length > 3 && (
                  <li className="text-[11px] text-neutral-500">+ още {dayEvents.length - 3}</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

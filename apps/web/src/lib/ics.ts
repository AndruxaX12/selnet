export function icsForEvent(ev: { id:string; title:string; desc?:string; where?:string; when:number; durationMin?:number }) {
  const dt = new Date(ev.when);
  const dtEnd = new Date(ev.when + (ev.durationMin||60)*60000);
  const fmt = (d:Date) => d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const uid = `${ev.id}@selnet` ;
  const lines = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SelNet//BG//EN","CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}` ,
    `DTSTAMP:${fmt(new Date())}` ,
    `DTSTART:${fmt(dt)}` ,
    `DTEND:${fmt(dtEnd)}` ,
    `SUMMARY:${escapeICS(ev.title)}` ,
    ev.where ? `LOCATION:${escapeICS(ev.where)}`  : "",
    ev.desc ? `DESCRIPTION:${escapeICS(ev.desc)}`  : "",
    "END:VEVENT","END:VCALENDAR"
  ].filter(Boolean);
  return lines.join("\r\n");
}
function escapeICS(s:string){ return String(s).replace(/[,\n;]/g, m => ({",":"\\,", "\n":"\\n", ";":"\\;"}[m] as string)); }

export function icsForEvents(events: { id:string; title:string; desc?:string; where?:string; when:number; durationMin?:number }[]) {
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SelNet//BG//EN","CALSCALE:GREGORIAN"];

  for (const ev of events) {
    const dt = new Date(ev.when);
    const dtEnd = new Date(ev.when + (ev.durationMin||60)*60000);
    const fmt = (d:Date) => d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    const uid = `${ev.id}@selnet` ;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}` ,
      `DTSTAMP:${fmt(new Date())}` ,
      `DTSTART:${fmt(dt)}` ,
      `DTEND:${fmt(dtEnd)}` ,
      `SUMMARY:${escapeICS(ev.title)}` ,
      ev.where ? `LOCATION:${escapeICS(ev.where)}`  : "",
      ev.desc ? `DESCRIPTION:${escapeICS(ev.desc)}`  : "",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

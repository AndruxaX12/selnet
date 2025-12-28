import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { icsForEvents } from "@/lib/ics";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const userSnap = await adminDb.collection("users").where("icalToken","==", token).limit(1).get();
  if (userSnap.empty) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  const uid = userSnap.docs[0].id;

  // всички събития, за които имам RSVP (going|interested)
  const rsvpSnaps = await adminDb.collectionGroup("rsvp").where("by","==", uid).get();
  const eventIds = Array.from(new Set(rsvpSnaps.docs.map(d => d.ref.parent.parent!.id)));
  if (eventIds.length === 0) return calendarResponse([]);

  const events = await Promise.all(eventIds.map(id => adminDb.collection("events").doc(id).get()));
  const list = events.filter(s=>s.exists).map(s => ({ id: s.id, ...(s.data() as any) }));
  return calendarResponse(list);

  function calendarResponse(evts: any[]) {
    const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SelNet//BG//EN","CALSCALE:GREGORIAN"];
    for (const x of evts) {
      const dt = new Date(x.when);
      const dtEnd = new Date(x.when + (x.durationMin||60)*60000);
      const fmt = (d:Date) => d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
      const uid = `${x.id}@selnet` ;
      const escapeICS = (s:string) => String(s).replace(/[,\n;]/g, m => ({",":"\\,", "\n":"\\n", ";":"\\;"}[m] as string));

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}` ,
        `DTSTAMP:${fmt(new Date())}` ,
        `DTSTART:${fmt(dt)}` ,
        `DTEND:${fmt(dtEnd)}` ,
        `SUMMARY:${escapeICS(x.title||"Event")}` ,
        x.where ? `LOCATION:${escapeICS(x.where)}`  : "",
        x.desc ? `DESCRIPTION:${escapeICS(x.desc)}`  : "",
        "END:VEVENT"
      );
    }
    lines.push("END:VCALENDAR");
    const ics = lines.join("\r\n");
    return new NextResponse(ics, { headers: { "Content-Type":"text/calendar; charset=utf-8" } });
  }
}

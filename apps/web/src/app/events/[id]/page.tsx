import { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import RSVPBar from "@/components/events/RSVPBar";

type Props = { params: { locale: string; id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const snap = await adminDb.collection("events").doc(params.id).get();
  if (!snap.exists) return { title: "Събитие не е намерено" };

  const event = snap.data() as any;
  return {
    title: event.title || "Събитие",
    description: event.desc || "Детайли за събитието"
  };
}

export default async function EventDetailPage({ params }: Props) {
  const snap = await adminDb.collection("events").doc(params.id).get();
  if (!snap.exists) notFound();

  const event = { id: snap.id, ...snap.data() } as any;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{event.title || "Без заглавие"}</h1>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-2">📅 Дата и час</h3>
            <p className="text-gray-600">
              {new Date(event.when).toLocaleString('bg-BG')}
              {event.durationMin && ` (${event.durationMin} мин.)`}
            </p>
          </div>

          {event.where && (
            <div>
              <h3 className="font-semibold mb-2">📍 Място</h3>
              <p className="text-gray-600">{event.where}</p>
            </div>
          )}
        </div>

        {event.desc && (
          <div>
            <h3 className="font-semibold mb-2">📝 Описание</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{event.desc}</p>
          </div>
        )}

        {/* RSVP Bar */}
        <div className="border-t pt-4">
          <RSVPBar
            eventId={params.id}
            goingCount={event.goingCount||0}
            interestedCount={event.interestedCount||0}
          />
        </div>

        {/* iCal Download */}
        <div className="border-t pt-4">
          <a
            className="inline-flex items-center gap-2 rounded border px-3 py-1 text-sm hover:bg-gray-50 transition-colors"
            href={`/api/events/${params.id}/ics`}
          >
            📅 Добави в календар (.ics)
          </a>
        </div>
      </div>
    </div>
  );
}

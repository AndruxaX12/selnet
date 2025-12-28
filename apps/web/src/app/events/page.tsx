import { Metadata } from "next";
import { EventsPageClient } from "./EventsPageClient";

export const metadata: Metadata = {
  title: "Последни Събития - СелНет",
  description: "Преглед на предстоящи и минали събития в общината. Създайте събитие или потвърдете участие.",
  openGraph: {
    title: "Последни Събития - СелНет",
    description: "Преглед на предстоящи и минали събития",
    type: "website",
  },
};

export default function EventsPage() {
  return <EventsPageClient />;
}

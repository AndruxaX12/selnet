import { Metadata } from "next";
import { SignalsPageClient } from "./SignalsPageClient";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Всички сигнали - СелНет",
  description: "Преглед на последните подадени сигнали от граждани за проблеми в общината. Подайте сигнал или подкрепете съществуващ.",
  openGraph: {
    title: "Всички сигнали - СелНет",
    description: "Преглед на всички подадени сигнали от граждани за проблеми в общината.",
    type: "website",
  },
};

export default function SignalsPage() {
  return <SignalsPageClient />;
}

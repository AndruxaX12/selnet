import { Metadata } from "next";
import { IdeasPageClient } from "./IdeasPageClient";

export const metadata: Metadata = {
  title: "Последни Идеи - СелНет",
  description: "Преглед на последните споделени идеи от граждани за подобрение на общината. Споделете идея или подкрепете съществуваща.",
  openGraph: {
    title: "Последни Идеи - СелНет",
    description: "Преглед на последните споделени идеи от граждани",
    type: "website",
  },
};

export default function IdeasPage() {
  return <IdeasPageClient />;
}

export const metadata = { title: "Карта" };

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet-draw/dist/leaflet.draw.css" />
      {children}
    </>
  );
}

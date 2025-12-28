export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  url: string;
  type: "signal" | "event" | "idea";
};

export type BBox = [number, number, number, number]; // [south, west, north, east]

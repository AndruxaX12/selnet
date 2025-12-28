"use client";
import L from "leaflet";

// Fix за липсващи default икони в Next bundling (ако използваме default marker)
export const DefaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function coloredDot(color: string) {
  return L.divIcon({
    className: "rounded-full border",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.2)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9]
  });
}

export const ICONS = {
  signal: coloredDot("#1e90ff"), // синьо
  idea: coloredDot("#e67e22"),   // оранжево
  event: coloredDot("#2ecc71")   // зелено
};

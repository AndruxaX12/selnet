"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Категории с пътища към pointer изображенията
const CATEGORY_POINTERS: Record<string, string> = {
  "Пожар": "/pointers/Пожар.png",
  "ВиК": "/pointers/ВиК.png",
  "Ток": "/pointers/Ток.png",
  "Пътища и тротоари": "/pointers/Пътища и тротоари.png",
  "отпадъци": "/pointers/отпадъци.png",
  "Осветление": "/pointers/Осветление.png",
  "Транспорт": "/pointers/Транспорт.png",
  "Шум": "/pointers/Шум.png",
  "Друго": "/pointers/Друго.png",
};

// Create custom marker icon based on category using PNG pointers
function getMarkerIcon(category?: string) {
  const pointerUrl = category ? CATEGORY_POINTERS[category] : null;
  
  // PNG pointer-ите изглежда са с различни пропорции
  // Използваме по-голям размер и правилни пропорции (приблизително 1:1.2 за типичен marker)
  const iconWidth = 36;
  const iconHeight = 44; // Малко по-висок за да изглежда като pin
  const iconSize: [number, number] = [iconWidth, iconHeight];
  const iconAnchor: [number, number] = [iconWidth / 2, iconHeight]; // Центриран, долу
  
  // Ако има специфичен pointer за категорията, използвай го
  if (pointerUrl) {
    return new L.Icon({
      iconUrl: pointerUrl,
      iconSize: iconSize,
      iconAnchor: iconAnchor,
      popupAnchor: [0, -iconHeight],
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      shadowSize: [41, 41],
      shadowAnchor: [12, 41],
    });
  }
  
  // Fallback към default marker
  return new L.Icon({
    iconUrl: "/pointers/Друго.png",
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: [0, -iconHeight],
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
  });
}

interface SignalMapProps {
  lat: number;
  lng: number;
  title?: string;
  category?: string;
  address?: string;
  height?: number;
}

export default function SignalMap({ 
  lat, 
  lng, 
  title, 
  category, 
  address,
  height = 300 
}: SignalMapProps) {
  // Validate coordinates with fallback to Botevgrad center
  const validLat = typeof lat === "number" && !isNaN(lat) && lat !== 0 ? lat : 42.9069;
  const validLng = typeof lng === "number" && !isNaN(lng) && lng !== 0 ? lng : 23.7875;

  const googleMapsUrl = `https://www.google.com/maps?q=${validLat},${validLng}`;

  return (
    <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
      <MapContainer
        center={[validLat, validLng]}
        zoom={16}
        style={{ height, width: "100%" }}
        className="z-0"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[validLat, validLng]} icon={getMarkerIcon(category)}>
          <Popup>
            <div className="text-sm min-w-[200px]">
              {title && (
                <div className="font-semibold text-gray-900 mb-1">{title}</div>
              )}
              {category && (
                <div className="text-gray-600 text-xs mb-1">📍 {category}</div>
              )}
              {address && (
                <div className="text-gray-500 text-xs mb-2">{address}</div>
              )}
              <div className="text-xs text-gray-400 font-mono mb-2">
                {validLat.toFixed(6)}, {validLng.toFixed(6)}
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Отвори в Google Maps →
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

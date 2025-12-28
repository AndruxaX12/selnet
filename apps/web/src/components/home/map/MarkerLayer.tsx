"use client";

import { useState, useEffect } from "react";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { CircleMarker, Marker, Tooltip, useMap } from "react-leaflet";
import { useMapSelection } from "@/lib/mapSelection";
import { emitMarkerClick } from "@/components/home/map/events";

type Pt = { id: string; lat: number; lng: number; title?: string; url: string; type: "signals" | "ideas" | "events"; status?: string; category?: string };

const colorByType: Record<Pt["type"], string> = {
  signals: "#ef4444",
  ideas: "#f59e0b",
  events: "#a855f7"
};

// Интуитивна логика за размер на маркери според zoom:
// Малки в началото, леко нарастват при zoom in (за да се виждат детайлите)
function getIconSizeByZoom(zoom: number, baseSize: number): [number, number] {
  // При zoom < 10: малки маркери (много сигнали се виждат)
  if (zoom < 10) {
    return [baseSize * 0.6, (baseSize * 0.6 * 1.4)] as [number, number];
  }
  // При zoom 10-12: малко по-големи
  else if (zoom < 13) {
    return [baseSize * 0.75, (baseSize * 0.75 * 1.4)] as [number, number];
  }
  // При zoom 13-15: нормален размер
  else if (zoom < 16) {
    return [baseSize, baseSize * 1.4] as [number, number];
  }
  // При zoom >= 16: малко по-големи (детайли се виждат)
  else {
    return [baseSize * 1.15, (baseSize * 1.15 * 1.4)] as [number, number];
  }
}

function pin(color: string, zoom: number = 12) {
  const [width, height] = getIconSizeByZoom(zoom, 24); // Базов размер 24px
  const svg = encodeURIComponent(
    `<svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 48s14-17 14-30A14 14 0 0 0 2 18c0 13 14 30 14 30Z" fill="${color}"/><circle cx="16" cy="17" r="6" fill="white"/></svg>`
  );
  return L.icon({ 
    iconUrl: `data:image/svg+xml;utf8,${svg}`, 
    iconSize: [width, height], 
    iconAnchor: [width / 2, height] 
  });
}

// Функция за създаване на custom икона от /pointers с динамичен размер
function categoryIcon(category: string, zoom: number = 12) {
  const [width, height] = getIconSizeByZoom(zoom, 28); // Базов размер 28px (умерен)
  return L.icon({
    iconUrl: `/pointers/${category}.png`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height]
  });
}

// Функция за избор на икона - custom за сигнали с категория, иначе default pin
function getMarkerIcon(point: Pt, zoom: number): L.Icon {
  // Ако има category и е сигнал, използваме custom икона
  if (point.type === "signals" && point.category) {
    return categoryIcon(point.category, zoom);
  }
  // Иначе използваме обикновен цветен pin
  return pin(colorByType[point.type], zoom);
}

// Hook за слушане на zoom промени
function useZoomLevel() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const updateZoom = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', updateZoom);
    return () => {
      map.off('zoomend', updateZoom);
    };
  }, [map]);

  return zoom;
}

export default function MarkerLayer({ points }: { points: Pt[] }) {
  const selectedId = useMapSelection((state) => state.id);
  const zoom = useZoomLevel();

  // Handle marker click - emit event to expand sidebar
  const handleMarkerClick = (point: Pt) => {
    // Emit event for sidebar to expand this signal
    if (point.type === "signals") {
      emitMarkerClick(point.id);
    }
  };

  return (
    <MarkerClusterGroup chunkedLoading maxClusterRadius={54} showCoverageOnHover={false} polygonOptions={{ color: "#4b5563" }}>
      {points.map((point) => (
        <Marker 
          key={`${point.type}:${point.id}`} 
          position={[point.lat, point.lng]} 
          icon={getMarkerIcon(point, zoom)}
          eventHandlers={{
            click: () => handleMarkerClick(point)
          }}
        >
          <Tooltip direction="top" offset={[0, -14]} opacity={0.9} permanent={false}>
            {point.title || point.id}
          </Tooltip>
        </Marker>
      ))}
      {selectedId && (() => {
        const [type, id] = selectedId.split(":");
        const match = points.find((point) => point.type === type && point.id === id);
        return match ? (
          <CircleMarker
            center={[match.lat, match.lng]}
            radius={12}
            pathOptions={{ color: "#111827", weight: 2, opacity: 0.85 }}
          />
        ) : null;
      })()}
    </MarkerClusterGroup>
  );
}

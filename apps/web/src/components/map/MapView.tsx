"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useClusters, Pt } from "./useClusters";
import HeatLayer from "./HeatLayer";
import DrawPolygon from "./DrawPolygon";

// Simple point-in-polygon implementation using ray casting algorithm
function pointInPolygon(point: [number, number], polygon: [number, number][]) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

const defaultCenter: [number, number] = [42.6977, 23.3219];

function BoundsWatcher({ onChange }: { onChange: (b: [number, number, number, number], z: number) => void }) {
  useMapEvents({
    moveend: (e) => {
      const m = e.target as L.Map;
      const b = m.getBounds();
      onChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], m.getZoom());
    }
  });
  return null;
}

interface MapViewProps {
  points: Pt[];
  initialMode?: "cluster" | "heat" | "none";
  showControls?: boolean;
  height?: number;
}

export default function MapView({
  points,
  initialMode = "cluster",
  showControls = true,
  height = 520
}: MapViewProps) {
  const [bounds, setBounds] = useState<[number, number, number, number] | undefined>();
  const [zoom, setZoom] = useState(7);
  const [mode, setMode] = useState<"cluster" | "heat" | "none">(initialMode);
  const [polygon, setPolygon] = useState<[number, number][] | null>(null);

  const filtered = useMemo(() => {
    if (!polygon || polygon.length === 0) return points;
    // Filter points by polygon
    return points.filter(p => pointInPolygon([p.lng, p.lat], polygon.map(([lat, lng]) => [lng, lat])));
  }, [points, polygon]);

  const { clusters, index } = useClusters(filtered, zoom, bounds);

  const heatPoints = useMemo(() =>
    filtered.map(p => [p.lat, p.lng, 0.6] as [number, number, number]),
    [filtered]
  );

  function onBounds(b: [number, number, number, number], z: number) {
    setBounds(b);
    setZoom(z);
  }

  function clearPolygon() {
    setPolygon(null);
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      {showControls && (
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setMode("cluster")}
            className={`rounded border px-3 py-1 text-sm ${mode === "cluster" ? "bg-black text-white" : ""}`}
          >
            Cluster
          </button>
          <button
            onClick={() => setMode("heat")}
            className={`rounded border px-3 py-1 text-sm ${mode === "heat" ? "bg-black text-white" : ""}`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setMode("none")}
            className={`rounded border px-3 py-1 text-sm ${mode === "none" ? "bg-black text-white" : ""}`}
          >
            Markers
          </button>
          <span className="mx-2 text-sm">|</span>
          <span className="text-sm">Polygon filter:</span>
          <button
            onClick={() => setPolygon([])}
            className="rounded border px-3 py-1 text-sm"
          >
            Draw
          </button>
          <button
            onClick={clearPolygon}
            className="rounded border px-3 py-1 text-sm"
          >
            Clear
          </button>
          {polygon && polygon.length > 0 && (
            <span className="text-xs text-neutral-600">
              Активен полигон ({polygon.length} точки)
            </span>
          )}
        </div>
      )}

      <MapContainer center={defaultCenter} zoom={7} style={{ height }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsWatcher onChange={(b, z) => onBounds(b, z)} />

        {/* Drawing only if in Draw mode (pressed "Draw" => polygon!=null but may be empty) */}
        {polygon !== null && <DrawPolygon onPolygon={(ll) => setPolygon(ll)} />}

        {mode === "heat" && <HeatLayer points={heatPoints} />}

        {mode === "cluster" && clusters.map(c => {
          if (c.count && c.count > 0) {
            // Cluster marker
            const html = `<div class="cluster">${c.count}</div>`;
            const icon = L.divIcon({
              html,
              className: "cluster-wrapper",
              iconSize: [32, 32]
            });
            return (
              <Marker
                key={`c-${c.lat}-${c.lng}-${c.count}`}
                position={[c.lat, c.lng]}
                icon={icon as any}
                eventHandlers={{
                  click: () => {
                    // Zoom to cluster bounds
                    const exp = index.getClusterExpansionZoom((c as any).id ? Number((c as any).id) : 0);
                    (document.querySelector(".leaflet-container") as any)?._leaflet_map?.setView([c.lat, c.lng], exp);
                  }
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-medium">Клъстер: {c.count}</div>
                    <div className="text-xs text-neutral-500">
                      {c.coll?.toUpperCase()} - {c.settlementLabel || "Неизвестно"}
                    </div>
                    {c.childrenIds && c.childrenIds.length > 0 && (
                      <div className="text-xs text-neutral-600 mt-1">
                        {c.childrenIds.length} елемента
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          } else {
            // Single marker
            return (
              <Marker key={c.id} position={[c.lat, c.lng]}>
                <Popup>
                  <div className="text-sm">
                    <div className="text-xs text-neutral-500">{c.coll?.toUpperCase()}</div>
                    <div className="font-medium">{c.title || c.id}</div>
                    <div className="text-xs text-neutral-600">{c.settlementLabel}</div>
                    {c.type && <div className="text-xs text-neutral-500">Тип: {c.type}</div>}
                    {c.status && <div className="text-xs text-neutral-500">Статус: {c.status}</div>}
                    <a className="underline text-xs" href={`/${c.coll}/${c.id}`}>
                      Отвори
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          }
        })}

        {mode === "none" && filtered.map(pt => (
          <Marker key={pt.id} position={[pt.lat, pt.lng]}>
            <Popup>
              <div className="text-sm">
                <div className="text-xs text-neutral-500">{pt.coll.toUpperCase()}</div>
                <div className="font-medium">{pt.title || pt.id}</div>
                <div className="text-xs text-neutral-600">{pt.settlementLabel}</div>
                {pt.type && <div className="text-xs text-neutral-500">Тип: {pt.type}</div>}
                {pt.status && <div className="text-xs text-neutral-500">Статус: {pt.status}</div>}
                <a className="underline text-xs" href={`/${pt.coll}/${pt.id}`}>
                  Отвори
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Micro styles for clusters */}
      <style jsx global>{`
        .cluster-wrapper {
          background: transparent;
          border: none;
        }
        .cluster {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.85);
          color: #fff;
          font-weight: 700;
          font-size: 12px;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

"use client";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { MapPoint } from "@/types/map";
import { useMapSelection } from "@/lib/mapSelection";

const icon = L.icon({ 
  iconUrl: "/marker.svg", 
  iconSize: [24, 36], 
  iconAnchor: [12, 36] 
});

export default function ClusterLayer({ points }: { points: MapPoint[] }) {
  const sel = useMapSelection(s => s.id);
  
  return (
    <MarkerClusterGroup chunkedLoading maxClusterRadius={54}>
      {points.map(p => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
          <Popup>
            <div className="text-sm font-medium">{p.title || "(без заглавие)"}</div>
            <a className="text-xs underline" href={p.url} target="_blank" rel="noopener">Отвори</a>
          </Popup>
        </Marker>
      ))}
      {sel && (() => {
        const p = points.find(x => x.id === sel);
        return p ? <CircleMarker center={[p.lat, p.lng]} radius={12} pathOptions={{ color: "#111" }} /> : null;
      })()}
    </MarkerClusterGroup>
  );
}

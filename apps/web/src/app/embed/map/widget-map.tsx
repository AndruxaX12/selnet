"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';

export default function WidgetMap({ points }:{ points:{id:string; title:string; url:string; geo?:{lat:number;lng:number}}[] }) {
  const center:[number,number] = [42.6977, 23.3219];

  // Create a simple red marker icon using SVG data URL
  const markerIcon = L.divIcon({
    html: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L12 36L24 32L12 2Z" fill="#FF0000"/>
      <path d="M12 2L12 36L12 32L12 2Z" stroke="#FF0000" stroke-width="2"/>
    </svg>`,
    className: "custom-marker",
    iconSize: [24, 36],
    iconAnchor: [12, 36]
  });

  return (
    <div style={{ height: 420, width: "100vw" }}>
      <MapContainer center={center} zoom={7} style={{ height: "100%", width:"100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
        {points.map(p=>(
          <Marker key={p.id} position={[p.geo!.lat, p.geo!.lng]} icon={markerIcon}>
            <Popup>
              <a href={p.url} target="_blank" rel="noopener" className="underline">{p.title||"Отвори"}</a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}


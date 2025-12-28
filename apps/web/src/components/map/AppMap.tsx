"use client";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import ClusterLayer from "./ClusterLayer";
import HeatLayer from "./HeatLayer";
import DrawFilter from "./DrawFilter";
import { MapPoint, BBox } from "@/types/map";
import { useEffect } from "react";

export default function AppMap({
  points, bbox, zoom = 7, onViewport, polygon, onPolygon, visualizationMode = "markers"
}: {
  points: MapPoint[];
  bbox?: BBox;
  zoom?: number;
  onViewport?: (bbox: BBox, zoom: number) => void;
  polygon?: [number, number][] | null;
  onPolygon?: (poly: [number, number][] | null) => void;
  visualizationMode?: "markers" | "heatmap";
}) {
  const center: [number, number] = bbox
    ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
    : [42.6977, 23.3219];

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "70vh", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                 attribution="&copy; OpenStreetMap contributors" />
      <ViewportWatcher onViewport={onViewport} />
      {visualizationMode === "markers" && <ClusterLayer points={points} />}
      {visualizationMode === "heatmap" && <HeatLayer points={points} />}
      <DrawFilter polygon={polygon} onPolygon={onPolygon} />
    </MapContainer>
  );
}

function ViewportWatcher({ onViewport }: { onViewport?: (bbox: BBox, zoom: number) => void }) {
  useEffect(() => {}, []);
  useMapEvents({
    moveend(e) {
      if (!onViewport) return;
      const m = e.target;
      const b = m.getBounds();
      const bb: BBox = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()];
      onViewport(bb, m.getZoom());
    }
  });
  return null;
}

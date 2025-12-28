"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";

export default function DrawFilter({
  polygon, onPolygon
}: { polygon?: [number, number][] | null; onPolygon?: (poly: [number, number][] | null) => void }) {
  const map = useMap();
  
  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // preload външен полигон ако има
    if (polygon?.length) {
      const pre = new L.Polygon(polygon.map(([lat, lng]) => [lat, lng]));
      drawnItems.addLayer(pre);
      map.fitBounds(pre.getBounds());
    }

    const drawControl = new (L as any).Control.Draw({
      position: "topright",
      draw: { 
        polygon: true, 
        polyline: false, 
        rectangle: false, 
        circle: false, 
        marker: false, 
        circlemarker: false 
      },
      edit: { featureGroup: drawnItems, remove: true }
    });
    map.addControl(drawControl);

    map.on((L as any).Draw.Event.CREATED, (e: any) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      const latlngs = (e.layer as any).getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
      onPolygon?.(latlngs);
    });

    map.on((L as any).Draw.Event.EDITED, (e: any) => {
      const layer = e.layers.getLayers()[0];
      if (!layer) return onPolygon?.(null);
      const latlngs = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
      onPolygon?.(latlngs);
    });

    map.on((L as any).Draw.Event.DELETED, () => onPolygon?.(null));

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map]); // eslint-disable-line

  return null;
}

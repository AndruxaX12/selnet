"use client";
import L from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function DrawPolygon({ onPolygon }: { onPolygon: (latlngs: [number, number][]) => void }) {
  const map = useMap();

  useEffect(() => {
    let drawControl: any = null;
    let cleanup: (() => void) | null = null;

    // Dynamically load leaflet-draw from CDN to avoid SSR issues
    const loadLeafletDraw = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Check if leaflet-draw is already loaded
        if ((L as any).Draw) {
          initializeDrawControl();
          return;
        }

        // Load the CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
        document.head.appendChild(link);

        // Load the script
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';
        script.async = true;

        script.onload = () => {
          // Wait a bit for the script to initialize
          setTimeout(initializeDrawControl, 100);
        };

        script.onerror = (error) => {
          console.error('Failed to load leaflet-draw script:', error);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load leaflet-draw:', error);
      }
    };

    const initializeDrawControl = () => {
      if (!(L as any).Draw) return;

      // Control for drawing only polygons
      drawControl = new (L as any).Control.Draw({
        draw: {
          polygon: true,
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false
        },
        edit: false
      });

      map.addControl(drawControl);

      function created(e: any) {
        const layer = e.layer as any;
        const latlngs = layer.getLatLngs()[0].map((p: any) => [p.lat, p.lng] as [number, number]);
        // Clear the polygon from the map; keep only coordinates as filter
        map.removeLayer(layer);
        onPolygon(latlngs);
      }

      map.on((L as any).Draw.Event.CREATED, created);

      cleanup = () => {
        map.off((L as any).Draw.Event.CREATED, created);
        if (drawControl) {
          map.removeControl(drawControl);
        }
      };
    };

    loadLeafletDraw();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [map, onPolygon]);

  return null;
}

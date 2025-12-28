"use client";
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { MapPoint } from '@/types/map';

type HeatPoint = [number, number, number]; // lat, lng, intensity
type HeatLayerProps = {
  points: MapPoint[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
  maxZoomIntensity?: number;
  gradient?: Record<number, string>;
};

// Utility to load leaflet.heat dynamically
const useLeafletHeat = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if ((L as any).heatLayer) {
      setIsLoaded(true);
      return;
    }

    // Load the script dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
    script.async = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = (error) => {
      console.error('Failed to load leaflet-heat script:', error);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  return isLoaded;
};

// Custom HeatLayer component
export default function HeatLayer({
  points,
  radius = 25,
  blur = 15,
  maxZoom = 17,
  minOpacity = 0.25,
  gradient
}: HeatLayerProps) {
  const map = useMap();
  const isLoaded = useLeafletHeat();

  useEffect(() => {
    if (!isLoaded || !(L as any).heatLayer) return;

    // Transform points to the format expected by Leaflet.heat
    const heatPoints = points.map(p => [p.lat, p.lng, 0.6]);

    // Create heat layer with options
    const layer = (L as any).heatLayer(heatPoints, {
      radius,
      blur,
      maxZoom,
      minOpacity,
      gradient: gradient || {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      },
    });

    // Add to map
    layer.addTo(map);

    // Cleanup function
    return () => {
      map.removeLayer(layer);
    };
  }, [map, isLoaded, points, radius, blur, maxZoom, minOpacity, gradient]);

  return null; // This component doesn't render anything directly
}

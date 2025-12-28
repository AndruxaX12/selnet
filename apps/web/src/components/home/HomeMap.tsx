"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import MarkerLayer from "@/components/home/map/MarkerLayer";
import FilterPanel, { type Filter } from "@/components/home/map/FilterPanel";
import { haversineKm } from "@/lib/geo2";
import { emitHomeMapCount } from "@/components/home/map/events";

const DEFAULT_CENTER = { lat: 42.9040, lng: 23.7946 }; // Botevgrad fallback

type Row = {
  id: string;
  title?: string;
  geo?: { lat?: number; lng?: number } | null;
  location?: { lat?: number; lng?: number } | null;
  url?: string;
  status?: string;
  category?: string;
};

type OverviewPayload = {
  signals?: Row[];
  ideas?: Row[];
  events?: Row[];
};

type Point = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  url: string;
  status?: string;
  type: "signals" | "ideas" | "events";
  category?: string;
};

export default function HomeMap({ locale = "bg" }: { locale?: "bg" | "en" }) {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [filter, setFilter] = useState<Filter>({
    types: { signals: true, ideas: true, events: true },
    statuses: ["novo", "v_process"],
    radiusKm: null,
    center: DEFAULT_CENTER
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => {
      window.removeEventListener("resize", checkViewport);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/home/overview")
      .then((res) => res.json())
      .then((payload: OverviewPayload) => {
        console.log("[HomeMap] API response:", payload);
        if (!cancelled) {
          setData(payload);
        }
      })
      .catch((error) => {
        console.error("[HomeMap] API error:", error);
        if (!cancelled) {
          setData({ signals: [], ideas: [], events: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const points = useMemo<Point[]>(() => {
    console.log("[HomeMap] Computing points, data:", data);
    console.log("[HomeMap] Filter:", filter);
    
    if (!data) {
      console.log("[HomeMap] No data, returning empty array");
      return [];
    }

    const collect = (rows: Row[] | undefined, type: Point["type"]): Point[] => {
      console.log(`[HomeMap] Collecting ${type} from ${rows?.length || 0} rows`);
      if (!rows?.length) return [];
      const out: Point[] = [];
      for (const row of rows) {
        const geo = row.geo ?? row.location ?? null;
        const lat = typeof geo?.lat === "number" ? geo.lat : undefined;
        const lng = typeof geo?.lng === "number" ? geo.lng : undefined;
        console.log(`[HomeMap] Row ${row.id}: geo=`, geo, "lat/lng=", lat, lng);
        
        if (lat === undefined || lng === undefined) {
          console.log(`[HomeMap] Skipping row ${row.id} - invalid coordinates`);
          continue;
        }
        
        out.push({
          id: row.id,
          lat,
          lng,
          title: row.title,
          url: `/${type}/${row.id}`,
          status: row.status,
          type,
          category: row.category
        });
      }
      console.log(`[HomeMap] Collected ${out.length} valid ${type} points`);
      return out;
    };

    let result: Point[] = [];
    if (filter.types.signals) {
      result = result.concat(collect(data.signals, "signals"));
    }
    if (filter.types.ideas) {
      result = result.concat(collect(data.ideas, "ideas"));
    }
    if (filter.types.events) {
      result = result.concat(collect(data.events, "events"));
    }

    console.log(`[HomeMap] Before status filter: ${result.length} points`);

    if (filter.statuses.length) {
      result = result.filter((point) => !point.status || filter.statuses.includes(point.status));
    }

    console.log(`[HomeMap] After status filter: ${result.length} points`);

    if (filter.radiusKm && filter.center) {
      const radius = filter.radiusKm ?? 0;
      result = result.filter((point) => haversineKm(filter.center!, { lat: point.lat, lng: point.lng }) <= radius);
    }

    console.log(`[HomeMap] Final result: ${result.length} points`);
    return result;
  }, [data, filter, locale]);

  useEffect(() => {
    emitHomeMapCount(points.length);
  }, [points.length]);

  const center = [filter.center?.lat ?? DEFAULT_CENTER.lat, filter.center?.lng ?? DEFAULT_CENTER.lng] as [number, number];

  return (
    <div className="relative w-full h-full">
      {/* FilterPanel само за desktop */}
      <div className="hidden md:block">
        <FilterPanel value={filter} onChange={setFilter} isMobile={false} />
      </div>
      <MapContainer
        center={center}
        zoom={12}
        minZoom={7}
        maxZoom={18}
        zoomControl={true}
        dragging={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        boxZoom={true}
        keyboard={true}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <MapViewUpdater center={center} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {filter.radiusKm && filter.center && (
          <Circle
            center={center}
            radius={(filter.radiusKm ?? 0) * 1000}
            pathOptions={{ color: "#111827", opacity: 0.25, weight: 1 }}
          />
        )}
        <MarkerLayer points={points} />
      </MapContainer>
    </div>
  );
}

function MapViewUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  const initializedRef = useRef(false);
  
  useEffect(() => {
    // Only set view on initial load, not on every center change
    // This prevents the map from jumping when sidebar expands
    if (!initializedRef.current) {
      map.setView(center, map.getZoom());
      initializedRef.current = true;
    }
  }, [map, center]);
  
  // Handle window resize to invalidate map size
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);
  
  return null;
}

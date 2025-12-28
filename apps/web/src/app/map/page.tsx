"use client";
import { useEffect, useState } from "react";
import AppMap from "@/components/map/AppMap";
import MapToolbar from "@/components/map/MapToolbar";
import { BBox, MapPoint } from "@/types/map";
import { decodeBBox, encodeBBox, pointInPolygon } from "@/lib/geo";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function MapPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [allPoints, setAll] = useState<MapPoint[]>([]);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [zoom, setZoom] = useState<number>(Number(sp.get("z")) || 7);
  const [bbox, setBBox] = useState<BBox | undefined>(decodeBBox(sp.get("bbox")));
  const [polygon, setPolygon] = useState<[number, number][] | null>(parsePoly(sp.get("poly")));

  // зареди данни (signals + events)
  useEffect(() => {
    Promise.all([
      fetch(`/api/public/list?coll=signals&limit=800`).then(r => r.json()).then(j => normalize(j.rows, "signal")),
      fetch(`/api/public/list?coll=events&limit=800`).then(r => r.json()).then(j => normalize(j.rows, "event"))
    ]).then(([s, e]) => setAll([...s, ...e].filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))));
  }, []);

  // филтър по полигон/bbox
  useEffect(() => {
    let list = allPoints;
    if (polygon?.length) {
      list = list.filter(p => pointInPolygon([p.lat, p.lng], polygon));
    } else if (bbox) {
      list = list.filter(p => p.lat >= bbox[0] && p.lat <= bbox[2] && p.lng >= bbox[1] && p.lng <= bbox[3]);
    }
    setPoints(list);
  }, [allPoints, bbox, polygon]);

  function onViewport(bb: BBox, z: number) {
    setBBox(bb); 
    setZoom(z);
    updateURL({ bbox: encodeBBox(bb), z: String(z), poly: polygon ? encodePoly(polygon) : undefined });
  }
  
  function onPolygonChanged(poly: [number, number][] | null) {
    setPolygon(poly);
    updateURL({ poly: poly ? encodePoly(poly) : undefined, bbox: bbox ? encodeBBox(bbox) : undefined, z: String(zoom) });
  }

  function onReset() {
    setPolygon(null);
    setBBox(undefined);
    updateURL({ poly: undefined, bbox: undefined, z: String(zoom) });
  }

  function updateURL(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp?.toString() || "");
    Object.entries(next).forEach(([k, v]) => {
      if (!v) params.delete(k); else params.set(k, v);
    });
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Карта</h1>
      <div className="text-xs text-neutral-600">
        Точки: {points.length}
        {polygon ? " · Филтър: Полигон" : bbox ? " · Филтър: BBox" : ""}
      </div>
      <MapToolbar onReset={onReset} />
      <AppMap 
        points={points} 
        bbox={bbox} 
        zoom={zoom} 
        onViewport={onViewport} 
        polygon={polygon} 
        onPolygon={onPolygonChanged} 
      />
    </div>
  );
}

function normalize(rows: any[], type: "signal" | "event" | "idea"): MapPoint[] {
  return rows.map(r => ({
    id: r.id, 
    lat: r.geo?.lat, 
    lng: r.geo?.lng, 
    title: r.title || "", 
    url: r.url, 
    type
  }));
}

function encodePoly(poly: [number, number][]) { 
  return poly.map(p => p.map(n => n.toFixed(5)).join(":")).join(","); 
}

function parsePoly(s?: string | null): [number, number][] | null {
  if (!s) return null;
  const pts = s.split(",").map(p => p.split(":").map(Number));
  if (!pts.length || pts.some(p => p.length !== 2 || p.some(isNaN))) return null;
  return pts as any;
}

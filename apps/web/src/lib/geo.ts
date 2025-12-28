import { BBox } from "@/types/map";

export function isValidLatLng(lat?: number, lng?: number) {
  return typeof lat === "number" && typeof lng === "number" && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function encodeBBox(b: BBox) { 
  return b.map(n => n.toFixed(5)).join(","); 
}

export function decodeBBox(s?: string | null): BBox | undefined {
  if (!s) return;
  const p = s.split(",").map(Number);
  if (p.length !== 4 || p.some(isNaN)) return;
  return [p[0], p[1], p[2], p[3]] as BBox;
}

export function pointInPolygon(pt: [number, number], poly: [number, number][]) {
  // ray casting — true ако точката е вътре
  let x = pt[1], y = pt[0], inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][1], yi = poly[i][0], xj = poly[j][1], yj = poly[j][0];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

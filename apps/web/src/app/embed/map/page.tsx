"use client";
import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./widget-map"), {
  ssr: false,
  loading: () => <div style={{ height: 420, width: "100vw", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>Зареждане на картата...</div>
});

export default function EmbedMapPage() {
  const [points, setPoints] = useState<any[]>([]);
  const sp = typeof window !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
  const limit = Number(sp.get("limit") || 500);

  useEffect(() => {
    Promise.all([
      fetch(`/api/public/list?coll=signals&limit=${Math.floor(limit/2)}` ).then(r=>r.json()).then(j=>j.rows||[]),
      fetch(`/api/public/list?coll=events&limit=${Math.floor(limit/2)}` ).then(r=>r.json()).then(j=>j.rows||[])
    ]).then(([s,e]) => setPoints([...s,...e].filter((p:any)=>p.geo && p.geo.lat && p.geo.lng)));
  }, [limit]);

  return (
    <Suspense fallback={<div style={{ height: 420, width: "100vw", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>Зареждане...</div>}>
      <MapComponent points={points} />
    </Suspense>
  );
}


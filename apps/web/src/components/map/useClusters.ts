"use client";
import { useEffect, useMemo, useState } from "react";

// Extend window interface
declare global {
  interface Window {
    Supercluster: any;
  }
}

export type Pt = {
  id: string;
  lat: number;
  lng: number;
  coll: "signals"|"ideas"|"events";
  title?: string;
  type?: string;
  status?: string;
  settlementLabel?: string;
  createdAt?: number;
};

export type ClusterPoint = {
  id: string;
  lat: number;
  lng: number;
  count?: number;
  childrenIds?: string[];
  coll?: string;
  title?: string;
  type?: string;
  status?: string;
  settlementLabel?: string;
  createdAt?: number;
};

// Simple clustering implementation without external dependencies
function createSimpleCluster(points: Pt[], zoom: number, bounds?: [number, number, number, number]) {
  if (!bounds) return [];

  const [west, south, east, north] = bounds;
  const clusters: ClusterPoint[] = [];

  // Simple distance-based clustering
  const clusterRadius = Math.max(60 / (zoom * zoom), 10); // Adjust based on zoom

  points.forEach(point => {
    const existingCluster = clusters.find(cluster => {
      const distance = Math.sqrt(
        Math.pow(cluster.lat - point.lat, 2) + Math.pow(cluster.lng - point.lng, 2)
      );
      return distance < clusterRadius;
    });

    if (existingCluster) {
      // Add to existing cluster
      existingCluster.count = (existingCluster.count || 1) + 1;
      if (!existingCluster.childrenIds) existingCluster.childrenIds = [];
      existingCluster.childrenIds.push(point.id);
    } else {
      // Create new cluster
      clusters.push({
        id: `cluster-${point.id}`,
        lat: point.lat,
        lng: point.lng,
        count: 1,
        childrenIds: [point.id],
        coll: point.coll,
        title: point.title,
        type: point.type,
        status: point.status,
        settlementLabel: point.settlementLabel,
        createdAt: point.createdAt
      });
    }
  });

  return clusters;
}

// Utility to load supercluster dynamically
const useSupercluster = () => {
  const [Supercluster, setSupercluster] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.Supercluster) {
      setSupercluster(window.Supercluster);
      return;
    }

    // Load the script dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/supercluster@8.0.1/dist/supercluster.min.js';
    script.async = true;

    script.onload = () => {
      // Wait a bit for the script to initialize globally
      setTimeout(() => {
        if ((window as any).supercluster) {
          window.Supercluster = (window as any).supercluster;
          setSupercluster(window.Supercluster);
        }
      }, 100);
    };

    script.onerror = (error) => {
      console.error('Failed to load supercluster script:', error);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  return Supercluster;
};

export function useClusters(points: Pt[], zoom: number, bounds?: [number, number, number, number]) {
  const [clusters, setClusters] = useState<ClusterPoint[]>([]);
  const Supercluster = useSupercluster();

  const index = useMemo(() => {
    if (!Supercluster) return null;

    const sc = new Supercluster({
      radius: 60,
      maxZoom: 18,
      minPoints: 3
    });

    sc.load(points.map(p => ({
      type: "Feature",
      properties: {
        id: p.id,
        coll: p.coll,
        title: p.title,
        type: p.type,
        status: p.status,
        settlementLabel: p.settlementLabel,
        createdAt: p.createdAt
      },
      geometry: {
        type: "Point",
        coordinates: [p.lng, p.lat]
      }
    })));

    return sc;
  }, [points, Supercluster]);

  useEffect(() => {
    if (!bounds) {
      setClusters([]);
      return;
    }

    let resultClusters: ClusterPoint[] = [];

    if (index) {
      // Use supercluster if available
      const res = index.getClusters(bounds, Math.round(zoom));
      resultClusters = res.map((f: any) => {
        const [lng, lat] = f.geometry.coordinates as [number, number];
        const props = f.properties as any;
        const isCluster = props.cluster;

        const cp: ClusterPoint = {
          id: String(f.id || props.id),
          lat,
          lng,
          coll: props.coll,
          title: props.title,
          type: props.type,
          status: props.status,
          settlementLabel: props.settlementLabel,
          createdAt: props.createdAt
        };

        if (isCluster) {
          cp.count = props.point_count;
          // Get children for this cluster
          const leaves = index.getLeaves(props.cluster_id, Infinity);
          cp.childrenIds = leaves.map((leaf: any) => leaf.properties.id);
        }

        return cp;
      });
    } else {
      // Fallback to simple clustering
      resultClusters = createSimpleCluster(points, zoom, bounds);
    }

    setClusters(resultClusters);
  }, [index, zoom, bounds, points]);

  return { clusters, index };
}

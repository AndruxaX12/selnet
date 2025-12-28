"use client";
import { useEffect, useState } from "react";

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming;
          setMetrics(prev => ({
            loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            firstInputDelay: 0,
            cumulativeLayoutShift: 0,
            ...prev
          }));
        }

        if (entry.entryType === "paint") {
          const paintEntry = entry as PerformancePaintTiming;
          setMetrics(prev => ({
            ...prev!,
            [paintEntry.name.toLowerCase().replace(" ", "")]: paintEntry.startTime
          }));
        }

        if (entry.entryType === "largest-contentful-paint") {
          const lcpEntry = entry as LargestContentfulPaint;
          setMetrics(prev => ({
            ...prev!,
            largestContentfulPaint: lcpEntry.startTime
          }));
        }

        if (entry.entryType === "layout-shift") {
          const clsEntry = entry as any;
          if (!clsEntry.hadRecentInput) {
            setMetrics(prev => ({
              ...prev!,
              cumulativeLayoutShift: (prev?.cumulativeLayoutShift || 0) + clsEntry.value
            }));
          }
        }

        if (entry.entryType === "first-input") {
          const fidEntry = entry as any;
          setMetrics(prev => ({
            ...prev!,
            firstInputDelay: fidEntry.processingStart - fidEntry.startTime
          }));
        }
      });
    });

    observer.observe({ entryTypes: ["navigation", "paint", "largest-contentful-paint", "layout-shift", "first-input"] });

    // Calculate initial metrics
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (navigation) {
      setMetrics({
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0
      });
    }

    return () => observer.disconnect();
  }, []);

  if (!show || !metrics) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-20 right-4 z-[9998] bg-green-600 text-white p-2 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        title="Performance"
      >
        📊
      </button>
    );
  }

  const getScore = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return { score: "good", color: "text-green-600" };
    if (value <= thresholds.poor) return { score: "needs-improvement", color: "text-yellow-600" };
    return { score: "poor", color: "text-red-600" };
  };

  const lcpScore = getScore(metrics.largestContentfulPaint, { good: 2500, poor: 4000 });
  const fidScore = getScore(metrics.firstInputDelay, { good: 100, poor: 300 });
  const clsScore = getScore(metrics.cumulativeLayoutShift, { good: 0.1, poor: 0.25 });

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white border rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Performance</h3>
        <button
          onClick={() => setShow(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className="font-mono">{Math.round(metrics.loadTime)}ms</span>
        </div>

        <div className="flex justify-between">
          <span>DOM Content Loaded:</span>
          <span className="font-mono">{Math.round(metrics.domContentLoaded)}ms</span>
        </div>

        <div className="flex justify-between">
          <span>First Paint:</span>
          <span className="font-mono">{Math.round(metrics.firstPaint)}ms</span>
        </div>

        <div className="flex justify-between">
          <span>First Contentful Paint:</span>
          <span className="font-mono">{Math.round(metrics.firstContentfulPaint)}ms</span>
        </div>

        <div className="flex justify-between">
          <span>Largest Contentful Paint:</span>
          <span className={`font-mono ${lcpScore.color}`}>
            {Math.round(metrics.largestContentfulPaint)}ms ({lcpScore.score})
          </span>
        </div>

        <div className="flex justify-between">
          <span>First Input Delay:</span>
          <span className={`font-mono ${fidScore.color}`}>
            {Math.round(metrics.firstInputDelay)}ms ({fidScore.score})
          </span>
        </div>

        <div className="flex justify-between">
          <span>Cumulative Layout Shift:</span>
          <span className={`font-mono ${clsScore.color}`}>
            {metrics.cumulativeLayoutShift.toFixed(3)} ({clsScore.score})
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
        <div>Web Vitals Score:</div>
        <div className="flex gap-1 mt-1">
          <span className={`px-2 py-1 rounded text-xs ${
            lcpScore.score === "good" && fidScore.score === "good" && clsScore.score === "good"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {lcpScore.score === "good" && fidScore.score === "good" && clsScore.score === "good"
              ? "Good"
              : "Needs Work"
            }
          </span>
        </div>
      </div>
    </div>
  );
}

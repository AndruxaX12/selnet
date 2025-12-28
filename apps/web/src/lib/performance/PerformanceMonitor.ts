"use client";

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge';
}

interface WebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private webVitals: WebVitals = {};
  private isEnabled = true;

  constructor() {
    this.initializeObservers();
    this.measureInitialMetrics();
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      this.isEnabled = false;
      return;
    }

    try {
      // Observe paint metrics
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.webVitals.FCP = entry.startTime;
            this.recordMetric('FCP', entry.startTime, 'timing');
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.webVitals.LCP = lastEntry.startTime;
        this.recordMetric('LCP', lastEntry.startTime, 'timing');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.webVitals.FID = (entry as any).processingStart - entry.startTime;
          this.recordMetric('FID', this.webVitals.FID, 'timing');
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Observe layout shifts
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.webVitals.CLS = clsValue;
        this.recordMetric('CLS', clsValue, 'gauge');
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          this.webVitals.TTFB = navEntry.responseStart - navEntry.requestStart;
          this.recordMetric('TTFB', this.webVitals.TTFB, 'timing');
          this.recordMetric('DOM_LOAD', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart, 'timing');
          this.recordMetric('WINDOW_LOAD', navEntry.loadEventEnd - navEntry.loadEventStart, 'timing');
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Observe resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric(`RESOURCE_${resourceEntry.initiatorType.toUpperCase()}`, 
            resourceEntry.responseEnd - resourceEntry.startTime, 'timing');
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
      this.isEnabled = false;
    }
  }

  private measureInitialMetrics(): void {
    if (!this.isEnabled) return;

    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('MEMORY_USED', memory.usedJSHeapSize, 'gauge');
      this.recordMetric('MEMORY_TOTAL', memory.totalJSHeapSize, 'gauge');
      this.recordMetric('MEMORY_LIMIT', memory.jsHeapSizeLimit, 'gauge');
    }

    // Connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric('CONNECTION_DOWNLINK', connection.downlink, 'gauge');
      this.recordMetric('CONNECTION_RTT', connection.rtt, 'gauge');
    }

    // Device info
    this.recordMetric('DEVICE_CORES', navigator.hardwareConcurrency || 1, 'gauge');
    this.recordMetric('VIEWPORT_WIDTH', window.innerWidth, 'gauge');
    this.recordMetric('VIEWPORT_HEIGHT', window.innerHeight, 'gauge');
  }

  private recordMetric(name: string, value: number, type: PerformanceMetric['type']): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log critical metrics
    if (this.isCriticalMetric(name, value)) {
      console.warn(`Performance warning: ${name} = ${value}ms`);
    }
  }

  private isCriticalMetric(name: string, value: number): boolean {
    const thresholds = {
      FCP: 1800, // First Contentful Paint > 1.8s
      LCP: 2500, // Largest Contentful Paint > 2.5s
      FID: 100,  // First Input Delay > 100ms
      CLS: 0.1,  // Cumulative Layout Shift > 0.1
      TTFB: 600  // Time to First Byte > 600ms
    };

    return name in thresholds && value > thresholds[name as keyof typeof thresholds];
  }

  // Public API
  public measureFunction<T>(name: string, fn: () => T): T {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.recordMetric(`FUNCTION_${name.toUpperCase()}`, duration, 'timing');
    return result;
  }

  public async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.recordMetric(`ASYNC_${name.toUpperCase()}`, duration, 'timing');
    return result;
  }

  public startTimer(name: string): () => void {
    if (!this.isEnabled) return () => {};

    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(`TIMER_${name.toUpperCase()}`, duration, 'timing');
    };
  }

  public incrementCounter(name: string, value = 1): void {
    this.recordMetric(`COUNTER_${name.toUpperCase()}`, value, 'counter');
  }

  public setGauge(name: string, value: number): void {
    this.recordMetric(`GAUGE_${name.toUpperCase()}`, value, 'gauge');
  }

  public getWebVitals(): WebVitals {
    return { ...this.webVitals };
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type);
  }

  public getAverageMetric(name: string): number {
    const metrics = this.metrics.filter(metric => metric.name === name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  public getPerformanceScore(): number {
    if (!this.isEnabled) return 100;

    const vitals = this.getWebVitals();
    let score = 100;

    // FCP scoring (0-40 points)
    if (vitals.FCP) {
      if (vitals.FCP > 3000) score -= 40;
      else if (vitals.FCP > 1800) score -= 20;
    }

    // LCP scoring (0-25 points)
    if (vitals.LCP) {
      if (vitals.LCP > 4000) score -= 25;
      else if (vitals.LCP > 2500) score -= 15;
    }

    // FID scoring (0-25 points)
    if (vitals.FID) {
      if (vitals.FID > 300) score -= 25;
      else if (vitals.FID > 100) score -= 15;
    }

    // CLS scoring (0-10 points)
    if (vitals.CLS) {
      if (vitals.CLS > 0.25) score -= 10;
      else if (vitals.CLS > 0.1) score -= 5;
    }

    return Math.max(0, score);
  }

  public generateReport(): string {
    const vitals = this.getWebVitals();
    const score = this.getPerformanceScore();
    
    let report = `Performance Report (Score: ${score}/100)\n`;
    report += `=====================================\n\n`;
    
    report += `Web Vitals:\n`;
    report += `- First Contentful Paint: ${vitals.FCP ? `${vitals.FCP.toFixed(2)}ms` : 'N/A'}\n`;
    report += `- Largest Contentful Paint: ${vitals.LCP ? `${vitals.LCP.toFixed(2)}ms` : 'N/A'}\n`;
    report += `- First Input Delay: ${vitals.FID ? `${vitals.FID.toFixed(2)}ms` : 'N/A'}\n`;
    report += `- Cumulative Layout Shift: ${vitals.CLS ? vitals.CLS.toFixed(3) : 'N/A'}\n`;
    report += `- Time to First Byte: ${vitals.TTFB ? `${vitals.TTFB.toFixed(2)}ms` : 'N/A'}\n\n`;
    
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length > 0) {
      report += `Recent Metrics:\n`;
      recentMetrics.forEach(metric => {
        report += `- ${metric.name}: ${metric.value.toFixed(2)}${metric.type === 'timing' ? 'ms' : ''}\n`;
      });
    }
    
    return report;
  }

  public sendToAnalytics(): void {
    if (!this.isEnabled) return;

    const data = {
      webVitals: this.getWebVitals(),
      performanceScore: this.getPerformanceScore(),
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };

    // Send to analytics service (implement based on your needs)
    console.log('Performance data:', data);
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    measureFunction: performanceMonitor.measureFunction.bind(performanceMonitor),
    measureAsyncFunction: performanceMonitor.measureAsyncFunction.bind(performanceMonitor),
    startTimer: performanceMonitor.startTimer.bind(performanceMonitor),
    incrementCounter: performanceMonitor.incrementCounter.bind(performanceMonitor),
    setGauge: performanceMonitor.setGauge.bind(performanceMonitor),
    getWebVitals: performanceMonitor.getWebVitals.bind(performanceMonitor),
    getPerformanceScore: performanceMonitor.getPerformanceScore.bind(performanceMonitor)
  };
}

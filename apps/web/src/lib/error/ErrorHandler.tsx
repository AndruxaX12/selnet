"use client";
import React from 'react';

export interface ErrorInfo {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  context?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'runtime' | 'ui' | 'pwa' | 'performance' | 'security';
}

class ErrorHandler {
  private errors: ErrorInfo[] = [];
  private maxErrors = 50;
  private isEnabled = true;

  constructor() {
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        severity: 'high',
        category: 'runtime'
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: { reason: event.reason },
        severity: 'high',
        category: 'runtime'
      });
    });

    // Handle network errors
    window.addEventListener('offline', () => {
      this.captureError({
        message: 'Network connection lost',
        severity: 'medium',
        category: 'network'
      });
    });

    // Handle PWA errors
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('error', (event) => {
        this.captureError({
          message: 'Service Worker error',
          stack: (event as any).error?.stack,
          severity: 'high',
          category: 'pwa'
        });
      });
    }
  }

  public captureError(error: Partial<ErrorInfo>): string {
    if (!this.isEnabled) return '';

    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
      context: error.context || {},
      severity: error.severity || 'medium',
      category: error.category || 'runtime'
    };

    this.errors.push(errorInfo);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorInfo);
    }

    // Send to monitoring service
    this.sendToMonitoring(errorInfo);

    // Show user notification for critical errors
    if (errorInfo.severity === 'critical') {
      this.showUserNotification(errorInfo);
    }

    return errorInfo.id;
  }

  public captureException(error: Error, context?: Record<string, any>): string {
    return this.captureError({
      message: error.message,
      stack: error.stack,
      context,
      severity: 'high',
      category: 'runtime'
    });
  }

  public captureNetworkError(url: string, status: number, context?: Record<string, any>): string {
    return this.captureError({
      message: `Network error: ${status} ${url}`,
      context: { url, status, ...context },
      severity: status >= 500 ? 'high' : 'medium',
      category: 'network'
    });
  }

  public captureUIError(component: string, action: string, error: Error): string {
    return this.captureError({
      message: `UI Error in ${component}: ${error.message}`,
      stack: error.stack,
      context: { component, action },
      severity: 'medium',
      category: 'ui'
    });
  }

  public capturePerformanceError(metric: string, value: number, threshold: number): string {
    return this.captureError({
      message: `Performance threshold exceeded: ${metric}`,
      context: { metric, value, threshold },
      severity: 'low',
      category: 'performance'
    });
  }

  public captureSecurityError(type: string, details: Record<string, any>): string {
    return this.captureError({
      message: `Security issue: ${type}`,
      context: details,
      severity: 'critical',
      category: 'security'
    });
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from auth context or localStorage
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : undefined;
    } catch {
      return undefined;
    }
  }

  private async sendToMonitoring(error: ErrorInfo): Promise<void> {
    try {
      // Send to monitoring service (Sentry, LogRocket, etc.)
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });
    } catch (sendError) {
      console.warn('Failed to send error to monitoring:', sendError);
    }
  }

  private showUserNotification(error: ErrorInfo): void {
    // Show user-friendly error notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Възникна проблем', {
        body: 'Приложението срещна неочаквана грешка. Моля опитайте отново.',
        icon: '/icons/icon-192.png'
      });
    }
  }

  // Public API
  public getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  public getErrorsByCategory(category: ErrorInfo['category']): ErrorInfo[] {
    return this.errors.filter(error => error.category === category);
  }

  public getErrorsBySeverity(severity: ErrorInfo['severity']): ErrorInfo[] {
    return this.errors.filter(error => error.severity === severity);
  }

  public clearErrors(): void {
    this.errors = [];
  }

  public getErrorStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let recent = 0;

    this.errors.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      if (error.timestamp > oneHourAgo) recent++;
    });

    return {
      total: this.errors.length,
      byCategory,
      bySeverity,
      recent
    };
  }

  public generateReport(): string {
    const stats = this.getErrorStats();
    const recentErrors = this.errors.slice(-5);

    let report = `Error Report\n`;
    report += `=============\n\n`;
    report += `Total Errors: ${stats.total}\n`;
    report += `Recent (1h): ${stats.recent}\n\n`;

    report += `By Category:\n`;
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      report += `- ${category}: ${count}\n`;
    });

    report += `\nBy Severity:\n`;
    Object.entries(stats.bySeverity).forEach(([severity, count]) => {
      report += `- ${severity}: ${count}\n`;
    });

    if (recentErrors.length > 0) {
      report += `\nRecent Errors:\n`;
      recentErrors.forEach(error => {
        report += `- [${error.severity}] ${error.message} (${new Date(error.timestamp).toLocaleString()})\n`;
      });
    }

    return report;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public enable(): void {
    this.isEnabled = true;
  }
}

// Export singleton
export const errorHandler = new ErrorHandler();

// React Error Boundary
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorHandler.captureError({
      message: error.message,
      stack: error.stack,
      context: { errorInfo },
      severity: 'high',
      category: 'ui'
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Възникна неочаквана грешка
        </h2>
        <p className="text-gray-600 mb-4">
          Моля презаредете страницата или се свържете с поддръжката.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Презареди страницата
        </button>
      </div>
    </div>
  );
}

"use client";
import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Възникна грешка
        </h1>
        <p className="text-gray-600 mb-4">
          Нещо се обърка в приложението. Моля, опитайте отново.
        </p>

        {error && (
          <details className="text-left mb-4">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Технически детайли
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex gap-2 justify-center">
          <button
            onClick={resetError}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Опитай отново
          </button>
          <button
            onClick={() => window.location.reload()}
            className="border hover:bg-gray-50 px-4 py-2 rounded text-sm transition-colors"
          >
            Презареди
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;

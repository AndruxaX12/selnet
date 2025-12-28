"use client";
import React from "react";

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: any) {
    console.error("Boundary error", err);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 border rounded-2xl">Нещо се обърка. Презаредете страницата.</div>;
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary;

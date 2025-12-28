"use client";

import * as React from "react";

interface AlertProps {
  variant?: "default" | "destructive" | "warning";
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = "default", children, className = "" }: AlertProps) {
  const variantClasses = {
    default: "bg-blue-50 border-blue-200 text-blue-800",
    destructive: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800"
  };

  return (
    <div className={`rounded-md border p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>;
}

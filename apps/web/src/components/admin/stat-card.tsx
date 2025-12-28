"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  link?: string;
  breakdown?: Record<string, number>;
}

export function StatCard({ title, value, subtitle, icon, trend, link, breakdown }: StatCardProps) {
  const content = (
    <Card className={link ? "cursor-pointer hover:shadow-md transition-shadow" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={`mt-2 flex items-center text-xs ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>{trend.value >= 0 ? '↑' : '↓'}</span>
                <span className="ml-1">{Math.abs(trend.value)}%</span>
                <span className="ml-1 text-muted-foreground">{trend.label}</span>
              </div>
            )}
            {breakdown && (
              <div className="mt-3 space-y-1">
                {Object.entries(breakdown).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {icon && (
            <div className="ml-4 rounded-lg bg-primary/10 p-3 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  
  if (link) {
    return <Link href={link}>{content}</Link>;
  }
  
  return content;
}

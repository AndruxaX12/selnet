"use client";

import { useEffect, useState } from "react";
import { StatCard } from "./stat-card";
import { Users, Shield, Mail, Activity } from "lucide-react";

interface DashboardStats {
  active_users_30d: number;
  roles_breakdown: {
    citizen: number;
    moderator: number;
    operator: number;
    ombudsman: number;
    admin: number;
  };
  total_role_assignments: number;
  pending_invites: number;
  audit_events_24h: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadStats();
  }, []);
  
  async function loadStats() {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Load stats error:", err);
    } finally {
      setIsLoading(false);
    }
  }
  
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded-lg border bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }
  
  if (!stats) {
    return null;
  }
  
  const roleBreakdownFormatted = {
    "Граждани": stats.roles_breakdown.citizen,
    "Модератори": stats.roles_breakdown.moderator,
    "Оператори": stats.roles_breakdown.operator,
    "Омбудсмани": stats.roles_breakdown.ombudsman,
    "Админи": stats.roles_breakdown.admin
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard
        title="Активни потребители"
        value={stats.active_users_30d}
        subtitle="Последните 30 дни"
        icon={<Users className="h-6 w-6" />}
        link="/admin/users"
      />
      
      <StatCard
        title="Роли по брой"
        value={stats.total_role_assignments}
        subtitle="Общо присвоени роли"
        icon={<Shield className="h-6 w-6" />}
        breakdown={roleBreakdownFormatted}
      />
      
      <StatCard
        title="Чакащи покани"
        value={stats.pending_invites}
        subtitle="Pending статус"
        icon={<Mail className="h-6 w-6" />}
        link="/admin/invites"
      />
      
      <StatCard
        title="Одит събития"
        value={stats.audit_events_24h}
        subtitle="Последните 24ч"
        icon={<Activity className="h-6 w-6" />}
        link="/admin/audit"
      />
    </div>
  );
}

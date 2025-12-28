"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ROLE_NAMES } from "@/lib/auth/policies";

interface ApprovalRequest {
  id: string;
  type: string;
  action: string;
  target_user_id: string;
  target_user_email?: string;
  role: string;
  scope?: any;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  requested_by_email: string;
  created_at: string;
}

export function PendingApprovals() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  useEffect(() => {
    loadApprovals();
  }, []);
  
  async function loadApprovals() {
    try {
      const res = await fetch("/api/admin/approvals?status=pending");
      const data = await res.json();
      setRequests(data.items || []);
    } catch (err) {
      console.error("Load approvals error:", err);
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleDecision(requestId: string, decision: "approve" | "reject") {
    const reason = prompt(
      decision === "approve"
        ? "Причина за одобрение (опционално):"
        : "Причина за отхвърляне (задължително):"
    );
    
    if (decision === "reject" && !reason) {
      alert("Причината е задължителна при отхвърляне");
      return;
    }
    
    setProcessingId(requestId);
    
    try {
      const res = await fetch(`/api/admin/approvals/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Грешка при обработка на заявката");
      }
      
      const data = await res.json();
      alert(data.message);
      
      // Reload approvals
      await loadApprovals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Чакащи одобрения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Зареждане...
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Чакащи одобрения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Няма чакащи заявки за одобрение
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Чакащи одобрения ({requests.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">
                    Присвояване на роля: <Badge variant="secondary">{ROLE_NAMES[request.role as keyof typeof ROLE_NAMES]}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Потребител: {request.target_user_email || request.target_user_id}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Заявено от: {request.requested_by_email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Дата: {new Date(request.created_at).toLocaleString("bg-BG")}
                  </div>
                </div>
                <Badge variant="default">Чака одобрение</Badge>
              </div>
              
              {request.scope && request.scope.type === 'area' && (
                <div className="text-sm">
                  <span className="font-medium">Обхват:</span> Area ({request.scope.settlements?.length || 0} населени места)
                </div>
              )}
              
              <div className="rounded-md bg-muted p-3">
                <div className="text-sm font-medium mb-1">Причина:</div>
                <div className="text-sm">{request.reason}</div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDecision(request.id, "approve")}
                  disabled={processingId === request.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingId === request.id ? "Обработване..." : "✓ Одобри"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDecision(request.id, "reject")}
                  disabled={processingId === request.id}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  ✗ Отхвърли
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

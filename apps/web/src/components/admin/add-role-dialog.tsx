"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ReasonField } from "./reason-field";
import { ScopeSelector, Scope } from "./scope-selector";
import { RoleKey, ROLE_NAMES } from "@/lib/auth/policies";

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentRoles: RoleKey[];
  onSuccess: () => void;
}

export function AddRoleDialog({
  open,
  onOpenChange,
  userId,
  currentRoles,
  onSuccess
}: AddRoleDialogProps) {
  const [role, setRole] = useState<RoleKey | "">("");
  const [scope, setScope] = useState<Scope | null>({ type: 'global' });
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const availableRoles: RoleKey[] = ["citizen", "moderator", "operator", "ombudsman", "admin"]
    .filter((r): r is RoleKey => !currentRoles.includes(r as RoleKey));
  
  const isHighRisk = role === 'admin' || role === 'ombudsman';
  const reasonError = reason.length > 0 && reason.length < 10
    ? "Причината трябва да е поне 10 символа"
    : "";
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role) {
      setError("Избери роля");
      return;
    }
    
    if (reason.length < 10) {
      setError("Причината трябва да е поне 10 символа");
      return;
    }
    
    if (scope?.type === 'area' && (!scope.settlements || scope.settlements.length === 0)) {
      setError("Избери поне едно населено място за area scope");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // Check if high-risk role (requires approval)
      if (isHighRisk) {
        // Create approval request
        const res = await fetch(`/api/admin/approvals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "role_assignment",
            action: "grant_role",
            target_user_id: userId,
            role,
            scope: scope?.type === 'global' ? null : scope,
            reason
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Грешка при създаване на заявка");
        }
        
        const data = await res.json();
        
        // Show success message for approval request
        alert(`Заявката е създадена успешно!\n\nID: ${data.request_id}\n\nИзисква се одобрение от втори администратор.`);
      } else {
        // Direct role assignment (non high-risk)
        const res = await fetch(`/api/admin/users/${userId}/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            scope: scope?.type === 'global' ? null : scope,
            reason,
            notify
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Грешка при присвояване на роля");
        }
        
        alert("Ролята е присвоена успешно!");
      }
      
      // Reset form
      setRole("");
      setScope({ type: 'global' });
      setReason("");
      setNotify(true);
      
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Добави роля</DialogTitle>
          <DialogDescription>
            Присвои нова роля на потребителя. Всички промени се записват в одит лога.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Select */}
          <div className="space-y-2">
            <Label htmlFor="role">Роля *</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as RoleKey)}
              className="w-full rounded-md border bg-background px-3 py-2"
              required
            >
              <option value="">Избери роля...</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_NAMES[r]}
                </option>
              ))}
            </select>
          </div>
          
          {/* Scope Selector */}
          <ScopeSelector value={scope} onChange={setScope} />
          
          {/* Reason Field */}
          <ReasonField
            value={reason}
            onChange={setReason}
            error={reasonError}
            minLength={10}
            placeholder="Опиши защо присвояваш тази роля (минимум 10 символа)..."
          />
          
          {/* High-risk warning */}
          {isHighRisk && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Това действие изисква одобрение от втори администратор.
                <br />
                <span className="text-xs">(Dual-control ще бъде имплементиран в Генериране 2)</span>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Notify checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="notify"
              checked={notify}
              onCheckedChange={(checked) => setNotify(checked as boolean)}
            />
            <Label htmlFor="notify" className="font-normal cursor-pointer">
              Изпрати уведомление по email
            </Label>
          </div>
          
          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отказ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Запазване..." : "Запази"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

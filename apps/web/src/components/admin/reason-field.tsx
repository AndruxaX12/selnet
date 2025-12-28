"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReasonFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
}

export function ReasonField({
  value,
  onChange,
  error,
  minLength = 10,
  maxLength = 500,
  placeholder = "Опиши причината..."
}: ReasonFieldProps) {
  const charCount = value.length;
  const isValid = charCount >= minLength;
  
  return (
    <div className="space-y-2">
      <Label>
        Причина *
        <span className="text-xs text-muted-foreground ml-2">
          (минимум {minLength} символа)
        </span>
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        maxLength={maxLength}
        className={error ? 'border-destructive' : ''}
      />
      <div className="flex justify-between text-xs">
        <span className={error ? 'text-destructive' : 'text-muted-foreground'}>
          {error || ''}
        </span>
        <span className={
          isValid
            ? 'text-green-600'
            : 'text-muted-foreground'
        }>
          {charCount} / {maxLength}
        </span>
      </div>
    </div>
  );
}

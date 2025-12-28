"use client";

import * as React from "react";

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <div className={className} role="radiogroup">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { groupValue: value, onGroupChange: onValueChange } as any);
        }
        return child;
      })}
    </div>
  );
}

interface RadioGroupItemProps {
  value: string;
  id: string;
  groupValue?: string;
  onGroupChange?: (value: string) => void;
}

export function RadioGroupItem({ value, id, groupValue, onGroupChange }: RadioGroupItemProps) {
  return (
    <input
      type="radio"
      id={id}
      value={value}
      checked={groupValue === value}
      onChange={() => onGroupChange?.(value)}
      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
    />
  );
}

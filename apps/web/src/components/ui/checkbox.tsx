"use client";

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({ id, checked, onCheckedChange, className = "" }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ${className}`}
    />
  );
}
